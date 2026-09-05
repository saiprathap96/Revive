import sqlite3
import json
import os
from dotenv import load_dotenv

load_dotenv()  # loads .env BEFORE the client is created

from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)
MODEL = "openai/gpt-oss-20b"        # scoring — fast, separate quota
EMAIL_MODEL = "openai/gpt-oss-120b" # emails — better writing



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


def score_invoice(invoice: dict) -> dict:
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user",
                   "content": RECOVERY_SCORE_PROMPT.format(invoice=invoice)}]
    )
    text = resp.choices[0].message.content.strip()
    # strip markdown code fences if the model adds them
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


def draft_email(invoice: dict) -> str:
    resp = client.chat.completions.create(
        model=EMAIL_MODEL,
        messages=[{"role": "user",
                   "content": EMAIL_PROMPT.format(**invoice)}]
    )
    return resp.choices[0].message.content
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
