import React, { useState } from 'react';

const color = s => s > 66 ? '#34d399' : s > 33 ? '#fbbf24' : '#f472b6';
const bg = s => s > 66 ? 'rgba(52,211,153,0.1)' : s > 33 ? 'rgba(251,191,36,0.1)' : 'rgba(244,114,182,0.1)';

export default function Reasoning({ invoices }) {
  const [sort, setSort] = useState('score-desc');

  const sorted = [...invoices].sort((a, b) => {
    if (sort === 'scoreasc') return a.recovery_score - b.recovery_score;
    if (sort === 'amount-desc') return b.amount - a.amount;
    return b.recovery_score - a.recovery_score;
  });

  return (
    <div>
      <div className="view-title">Agent Reasoning Log</div>
      <div className="view-sub">Why the agent scored each invoice the way it did — full transparency.</div>
      <div className="toolbar">
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="score-desc">Highest score first</option>
          <option value="scoreasc">Lowest score first</option>
          <option value="amount-desc">Largest amount first</option>
        </select>
      </div>
      {sorted.map(inv => (
        <div className="reason-card fade-in" key={inv.id}>
          <div className="score-big" style={{ color: color(inv.recovery_score), background: bg(inv.recovery_score) }}>
            {inv.recovery_score}
          </div>
          <div>
            <b>{inv.customer}</b>{' '}
            <span className="inv-id">{inv.id}</span>
            <span className="tagx" style={{ marginLeft: 8 }}>${inv.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <p>{inv.reasoning || '-'}</p>
            <div className="meta">
              {String(inv.status).replace('_', ' ')} &middot; {inv.attempts} failed attempts &middot; via {inv.best_channel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
