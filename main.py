from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

import os
import traceback
from agent.recovery_agent import run_agent

app = FastAPI(title="Revive — AI Revenue Recovery Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "revive-ui", "build")

# ── Landing page ─────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def home():
    landing = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "index.html")
    with open(landing, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# ── React dashboard HTML ──────────────────────────────────────────────────────
@app.get("/dashboard", response_class=FileResponse)
def dashboard():
    return FileResponse(os.path.join(BUILD_DIR, "index.html"))

# ── API ───────────────────────────────────────────────────────────────────────
@app.get("/api/recoverable")
def get_recoverable():
    try:
        results = run_agent()
    except Exception as e:
        return {
            "error": str(e),
            "traceback": traceback.format_exc()[-1500:],
        }

    leaked = sum(r["amount"] for r in results)
    recoverable = sum(r["amount"] for r in results if r["recovery_score"] > 40)
    return {
        "summary": {
            "total_leaked": round(leaked, 2),
            "projected_recovery": round(recoverable, 2),
            "recovery_rate": f"{round(recoverable / leaked * 100)}%" if leaked else "0%",
        },
        "invoices": results,
    }

@app.post("/api/recoverable")
def rerun_agent():
    try:
        results = run_agent()
        leaked = sum(r["amount"] for r in results)
        recoverable = sum(r["amount"] for r in results if r["recovery_score"] > 40)
        return {
            "summary": {
                "total_leaked": round(leaked, 2),
                "projected_recovery": round(recoverable, 2),
                "recovery_rate": f"{round(recoverable / leaked * 100)}%" if leaked else "0%",
            },
            "invoices": results,
        }
    except Exception as e:
        return {"error": str(e)}

# ── Serve React build static assets LAST (catch-all for /static/...) ─────────
# Must be mounted AFTER all API routes to avoid conflicts
if os.path.isdir(BUILD_DIR):
    app.mount("/", StaticFiles(directory=BUILD_DIR, html=True), name="react-build")
