import React from 'react';

export default function Sidebar({ view, navigate, invoicesCount, draftsCount }) {
  return (
    <nav className="sidebar">
      <div className="brand">
        <div className="logo" />
        <div><h1>Revive</h1><span>Recovery Intelligence</span></div>
      </div>
      <div className="nav-label">Overview</div>
      <div className={`nav-item${view === 'dashboard' ? ' active' : ''}`} onClick={() => navigate('dashboard')}>
        <span className="icon-chip ic-grid" />Dashboard
      </div>
      <div className={`nav-item${view === 'invoices' ? ' active' : ''}`} onClick={() => navigate('invoices')}>
        <span className="icon-chip ic-list" />All Invoices
        <span className="tagx" style={{ marginLeft: 'auto' }}>{invoicesCount}</span>
      </div>
      <div className={`nav-item${view === 'drafts' ? ' active' : ''}`} onClick={() => navigate('drafts')}>
        <span className="icon-chip ic-mail" />Outreach Drafts
        <span className="tagx" style={{ marginLeft: 'auto' }}>{draftsCount}</span>
      </div>
      <div className="nav-label">Intelligence</div>
      <div className={`nav-item${view === 'reasoning' ? ' active' : ''}`} onClick={() => navigate('reasoning')}>
        <span className="icon-chip ic-brain" />Agent Reasoning
      </div>
      <div className={`nav-item${view === 'settings' ? ' active' : ''}`} onClick={() => navigate('settings')}>
        <span className="icon-chip ic-gear" />Settings
      </div>
      <div className="footer">
        <b><span className="status-dot" />AI AGENT ACTIVE</b><br />
        Scoring invoices and drafting recovery emails autonomously.
      </div>
    </nav>
  );
}
