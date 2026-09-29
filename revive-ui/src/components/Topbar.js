import React, { useState } from 'react';

export default function Topbar({ title, crumb, onExport, onRerun, onAvatar }) {
  const [rerunning, setRerunning] = useState(false);

  const handleRerun = async () => {
    setRerunning(true);
    await onRerun();
    setRerunning(false);
  };

  return (
    <div className="topbar">
      <div>
        <h2>{title}</h2>
        <div className="crumb">{crumb}</div>
      </div>
      <div className="topbar-actions">
        <button className="btn" onClick={onExport}>Export CSV</button>
        <button className="btn" onClick={handleRerun} disabled={rerunning}>
          {rerunning ? 'Running...' : 'Re-run Agent'}
        </button>
        <span className="live"><span className="status-dot" />Live</span>
        <div className="avatar" onClick={onAvatar}>RV</div>
      </div>
    </div>
  );
}
