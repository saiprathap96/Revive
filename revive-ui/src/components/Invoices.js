import React, { useState, useEffect } from 'react';

function scoreClass(s) { return s > 66 ? 'high' : s > 33 ? 'medium' : 'low'; }
function scoreFill(s) { return s > 66 ? '#34d399' : s > 33 ? '#fbbf24' : '#f472b6'; }

export default function Invoices({ invoices, showToast }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [sortKey, setSortKey] = useState('recovery_score');
  const [sortDir, setSortDir] = useState(-1);
  const [expanded, setExpanded] = useState(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSearch(''); setFilterStatus(''); setFilterScore('');
        showToast('Filters cleared');
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showToast]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const visible = invoices.filter(i =>
    (!filterStatus || i.status === filterStatus) &&
    (!filterScore ||
      (filterScore === 'high' && i.recovery_score > 66) ||
      (filterScore === 'medium' && i.recovery_score > 33 && i.recovery_score <= 66) ||
      (filterScore === 'low' && i.recovery_score <= 33)
    ) &&
    (!search || (i.customer + ' ' + i.id).toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    const x = a[sortKey], y = b[sortKey];
    return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sortDir;
  });

  const SortTh = ({ k, children }) => (
    <th className="sortable" onClick={() => handleSort(k)}>
      {children}{sortKey === k ? (sortDir === -1 ? ' ▼' : ' ▲') : ''}
    </th>
  );

  return (
    <div>
      <div className="view-title">All Invoices</div>
      <div className="view-sub">Select any row to inspect the AI decision trail and draft email.</div>
      <div className="toolbar">
        <input
          type="text" placeholder="Search invoice or customer..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="failed">Failed</option>
          <option value="at_risk">At risk</option>
        </select>
        <select value={filterScore} onChange={e => setFilterScore(e.target.value)}>
          <option value="">All scores</option>
          <option value="high">High (67+)</option>
          <option value="medium">Medium (34-66)</option>
          <option value="low">Low (0-33)</option>
        </select>
        <button className="btn" onClick={() => { setSearch(''); setFilterStatus(''); setFilterScore(''); showToast('Filters cleared'); }}>Clear</button>
        <span className="count-pill">{visible.length} of {invoices.length}</span>
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <SortTh k="id">Invoice</SortTh>
              <SortTh k="customer">Customer</SortTh>
              <SortTh k="amount">Amount</SortTh>
              <SortTh k="status">Status</SortTh>
              <SortTh k="recovery_score">AI Score</SortTh>
              <th>Channel</th>
              <th>Retry</th>
            </tr>
          </thead>
          <tbody>
            {!visible.length ? (
              <tr><td colSpan="7" className="empty">No invoices match your filters.</td></tr>
            ) : visible.map(inv => {
              const cls = scoreClass(inv.recovery_score);
              const fill = scoreFill(inv.recovery_score);
              const isOpen = expanded === inv.id;
              const tdPad = compact ? '7px 16px' : '';
              return (
                <React.Fragment key={inv.id}>
                  <tr
                    className={`row${isOpen ? ' expanded' : ''}`}
                    onClick={() => setExpanded(isOpen ? null : inv.id)}
                  >
                    <td className="inv-id" style={{ padding: tdPad }}>{inv.id}</td>
                    <td style={{ padding: tdPad }}><b>{inv.customer}</b></td>
                    <td style={{ padding: tdPad }}><b>${inv.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b></td>
                    <td style={{ padding: tdPad }}><span className={`badge ${inv.status}`}>{String(inv.status).replace('_', ' ')}</span></td>
                    <td style={{ padding: tdPad }}>
                      <div className="score-bar">
                        <span className={`badge ${cls}`}>{inv.recovery_score}</span>
                        <div className="track"><div className="fill" style={{ width: inv.recovery_score + '%', background: fill }} /></div>
                      </div>
                    </td>
                    <td style={{ padding: tdPad }}>{inv.best_channel || '-'}</td>
                    <td style={{ padding: tdPad }}>{inv.retry_in_days === null || inv.retry_in_days === undefined ? '-' : inv.retry_in_days} days</td>
                  </tr>
                  {isOpen && (
                    <tr className="email-row">
                      <td colSpan="7">
                        <div className="panel-grid">
                          <div className="panel">
                            <h4>Agent Reasoning</h4>
                            <div className="reasoning">{inv.reasoning || '-'}</div>
                          </div>
                          <div className="panel">
                            <h4>Draft Recovery Email</h4>
                            <div className="email-box">{inv.draft_email || 'Score below threshold — no email drafted.'}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
