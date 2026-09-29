import React from 'react';

export default function Drafts({ invoices, navigate, showToast }) {
  const withEmails = invoices.filter(i => i.draft_email);

  const copyEmail = (inv) => {
    navigator.clipboard.writeText(inv.draft_email)
      .then(() => showToast('Email for ' + inv.customer + ' copied to clipboard'))
      .catch(() => showToast('Copy failed — select the text manually'));
  };

  return (
    <div>
      <div className="view-title">AI Outreach Drafts</div>
      <div className="view-sub">Auto-generated recovery emails for high-scoring invoices. One click to copy.</div>
      {!withEmails.length ? (
        <div className="empty">No drafts yet — they appear automatically for invoices scoring above 40.</div>
      ) : withEmails.map(inv => (
        <div className="draft-card fade-in" key={inv.id}>
          <div className="draft-head">
            <b>{inv.customer}</b>
            <span className="inv-id">{inv.id}</span>
            <span className="tagx">{inv.best_channel} &middot; retry in {inv.retry_in_days}d</span>
            <span className="amt">${inv.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="email-box">{inv.draft_email}</div>
          <div className="draft-actions">
            <button className="btn" onClick={() => copyEmail(inv)}>Copy Email</button>
            <button className="btn" onClick={() => navigate('invoices')}>View in Table</button>
          </div>
        </div>
      ))}
    </div>
  );
}
