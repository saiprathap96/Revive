from fastapi.responses import FileResponse
from dotenv import load_dotenv
load_dotenv()

import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agent.recovery_agent import run_agent

app = FastAPI(title="Revive — AI Revenue Recovery Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/dashboard")
def dashboard():
    return FileResponse("static/index.html")

   
@app.get("/")
def home():
    return {
        "message": "Revive — AI Revenue Recovery Agent",
        "docs": "/docs",
        "api": "/api/recoverable",
    }


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
