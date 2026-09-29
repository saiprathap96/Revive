# Revive — AI Revenue Recovery Agent

Revive is a revenue-recovery dashboard that surfaces unpaid or at-risk invoices, scores recovery likelihood, and drafts customer follow-up messages using AI.

## Overview

This project combines:

- a FastAPI backend that reads invoice data and computes recovery insights
- a React dashboard for operations teams to review recoverable revenue
- a SQLite data source with mock invoice data for local demos

## Architecture

- Backend: Python + FastAPI + SQLite
- Frontend: React + CRA
- AI fallback: Groq/OpenAI-compatible API with local heuristic fallback when external calls fail or rate-limit

## Repository layout

- `main.py` — FastAPI app entry point
- `agent/recovery_agent.py` — invoice scoring and email generation logic
- `data/mock_payments.py` — mock invoice generator
- `static/` — static dashboard shell
- `revive-ui/` — React dashboard app
- `tests/` — regression tests

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- A Groq API key (optional for full AI scoring; the app will fall back gracefully without it)

## Local setup

1. Clone the repository.
2. Create and activate a virtual environment:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

3. Install backend dependencies:

```bash
pip install -r requirements.txt
```

4. Install frontend dependencies:

```bash
cd revive-ui
npm install
```

5. Create a `.env` file in the project root with your API key:

```bash
GROQ_API_KEY=your_key_here
```

6. Run the backend:

```bash
python main.py
```

If you want to run with uvicorn directly:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

7. Run the frontend in a second terminal:

```bash
cd revive-ui
npm start
```

## API

The backend exposes the following endpoints:

- `GET /` — API status
- `GET /api/recoverable` — returns revenue summary and invoice recovery scores
- `GET /dashboard` — serves the dashboard page

## Usage notes

- If the AI provider is unavailable or rate-limited, the app automatically falls back to a heuristic scoring model so the dashboard still works.
- Mock invoice data is stored in `revenue.db`, which is generated locally during app use.

## Deployment

This repository includes a GitHub Actions deployment workflow in `.github/workflows/deploy.yml` that validates the backend and React frontend before building the app for deployment.

## License

This project is provided for demonstration and internal business use.
