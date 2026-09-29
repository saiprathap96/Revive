import React, { useState } from 'react';

function Switch({ on, onToggle }) {
  return (
    <div className={`switch${on ? ' on' : ''}`} onClick={onToggle} />
  );
}

export default function Settings({ invoices, fmt }) {
  const [autoDraft, setAutoDraft] = useState(true);
  const [preferCalls, setPreferCalls] = useState(false);
  const [compact, setCompact] = useState(false);

  const recoverableValue = fmt(
    invoices.filter(i => i.recovery_score > 40).reduce((s, i) => s + i.amount, 0)
  );

  return (
    <div>
      <div className="view-title">Settings</div>
      <div className="view-sub">Agent configuration and system information.</div>
      <div className="card">
        <div className="setting-row">
          <div className="info">
            <b>Auto-draft emails</b>
            <span>Draft recovery email when score is above 40</span>
          </div>
          <Switch on={autoDraft} onToggle={() => setAutoDraft(v => !v)} />
        </div>
        <div className="setting-row">
          <div className="info">
            <b>Prefer calls for high-value</b>
            <span>Over $2,000 routes to channel: call</span>
          </div>
          <Switch on={preferCalls} onToggle={() => setPreferCalls(v => !v)} />
        </div>
        <div className="setting-row">
          <div className="info">
            <b>Compact table rows</b>
            <span>Denser invoice list</span>
          </div>
          <Switch on={compact} onToggle={() => setCompact(v => !v)} />
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>System</h3></div>
        <div className="kv">
          <div className="k">Agent model</div><div className="v">openai/gpt-oss-120b (Groq)</div>
          <div className="k">Backend</div><div className="v">FastAPI + Uvicorn</div>
          <div className="k">Database</div><div className="v">SQLite — revenue.db</div>
          <div className="k">Invoices in DB</div><div className="v">{invoices.length} analyzed</div>
          <div className="k">Recoverable value</div><div className="v">{recoverableValue}</div>
        </div>
      </div>
    </div>
  );
}
