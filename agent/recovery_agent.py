import sqlite3
import json
import os
from dotenv import load_dotenv

load_dotenv()  # loads .env BEFORE the client is created

from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
    max_retries=0,
    timeout=5.0,
)
MODEL = "openai/gpt-oss-20b"        # scoring — fast, separate quota
EMAIL_MODEL = "openai/gpt-oss-120b" # emails — better writing
_AI_DISABLED = False


RECOVERY_SCORE_PROMPT = """You are a revenue recovery analyst. Given invoice data,
respond ONLY with a JSON object with EXACTLY these keys:
- recovery_score (integer 0-100): likelihood of recovering this payment
- best_channel: "email", "whatsapp", or "call"
- retry_in_days (integer): optimal retry timing
- reason (string): one sentence explaining your score

Invoice: {invoice}"""

EMAIL_PROMPT = """Write a short, friendly, professional payment recovery email.
Tone: helpful, not pushy. Customer: {customer}, Amount: ${amount},
Failure reason: {failure_reason}. Include a payment link placeholder. Max 120 words."""


def fallback_score(invoice: dict, error: Exception | None = None) -> dict:
    amount = float(invoice.get("amount", 0) or 0)
    failure_reason = (invoice.get("failure_reason") or "").lower()
    score = 25

    if amount >= 3000:
        score += 25
    elif amount >= 1000:
        score += 18
    elif amount >= 500:
        score += 12

    if failure_reason in {"card_expired", "insufficient_funds"}:
        score += 18
    elif failure_reason in {"payment_retry_failed", "billing_error"}:
        score += 10

    attempts = int(invoice.get("attempts") or 0)
    if attempts >= 3:
        score += 8
    if invoice.get("status") == "failed":
        score += 10

    score = max(0, min(100, score))
    if score >= 80:
        best_channel = "call"
        retry_in_days = 1
    elif score >= 55:
        best_channel = "whatsapp"
        retry_in_days = 2
    else:
        best_channel = "email"
        retry_in_days = 3

    reasoning = (
        f"AI fallback: a heuristic score was used because the external service was unavailable. "
        f"Invoice {invoice.get('id', 'unknown')} has a {failure_reason or 'payment'} issue and ${amount:,.2f} outstanding."
        if error else
        f"Invoice {invoice.get('id', 'unknown')} has a {failure_reason or 'payment'} issue and ${amount:,.2f} outstanding."
    )

    return {
        "recovery_score": score,
        "best_channel": best_channel,
        "retry_in_days": retry_in_days,
        "reasoning": reasoning,
    }


def score_invoice(invoice: dict) -> dict:
    global _AI_DISABLED
    if _AI_DISABLED:
        return fallback_score(invoice)

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user",
                       "content": RECOVERY_SCORE_PROMPT.format(invoice=invoice)}],
            timeout=5.0,
        )
        text = resp.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text)
        return {
            "recovery_score": int(result.get("recovery_score", 0)),
            "best_channel": result.get("best_channel", "email"),
            "retry_in_days": result.get("retry_in_days", 3),
            "reasoning": result.get("reason")
                         or result.get("reasoning")
                         or result.get("explanation")
                         or "No reasoning returned",
        }
    except Exception as exc:
        _AI_DISABLED = True
        return fallback_score(invoice, exc)


def draft_email(invoice: dict) -> str:
    global _AI_DISABLED
    if _AI_DISABLED:
        customer = invoice.get("customer", "Customer")
        amount = invoice.get("amount", 0)
        reason = invoice.get("failure_reason") or "payment issue"
        return (
            f"Hi {customer},\n\nWe noticed an outstanding payment of ${amount:.2f} on your account. "
            f"The invoice is currently on hold because of a {reason}. We’d be happy to help you resolve this quickly. "
            f"Please use the secure payment link below to complete the payment at your earliest convenience.\n\n"
            f"Payment link: [Secure payment link]\n\nThank you for your prompt attention."
        )

    try:
        resp = client.chat.completions.create(
            model=EMAIL_MODEL,
            messages=[{"role": "user",
                       "content": EMAIL_PROMPT.format(**invoice)}],
            timeout=5.0,
        )
        return resp.choices[0].message.content
    except Exception:
        _AI_DISABLED = True
        customer = invoice.get("customer", "Customer")
        amount = invoice.get("amount", 0)
        reason = invoice.get("failure_reason") or "payment issue"
        return (
            f"Hi {customer},\n\nWe noticed an outstanding payment of ${amount:.2f} on your account. "
            f"The invoice is currently on hold because of a {reason}. We’d be happy to help you resolve this quickly. "
            f"Please use the secure payment link below to complete the payment at your earliest convenience.\n\n"
            f"Payment link: [Secure payment link]\n\nThank you for your prompt attention."
        )
_CACHE = {}  # simple in-memory cache

def run_agent():
    conn = sqlite3.connect("revenue.db")
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM invoices WHERE status != 'paid'").fetchall()
    results = []
    for r in rows:
        inv = dict(r)
        if inv["id"] in _CACHE:
            results.append(_CACHE[inv["id"]])
            continue
        try:
            score = score_invoice(inv)
            email = draft_email(inv) if score.get("recovery_score", 0) > 40 else None
        except Exception as e:
            score = {"recovery_score": 0, "best_channel": "email",
                     "retry_in_days": 3, "reasoning": f"AI error: {e}"}
            email = None
        _CACHE[inv["id"]] = {**inv, **score, "draft_email": email}
        results.append(_CACHE[inv["id"]])
    return results
