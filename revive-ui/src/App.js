import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import Invoices from './components/Invoices';
import Drafts from './components/Drafts';
import Reasoning from './components/Reasoning';
import Settings from './components/Settings';
import Toast from './components/Toast';

const VIEW_META = {
  dashboard: ['Revenue Recovery Dashboard', 'Home / Overview'],
  invoices:  ['All Invoices', 'Home / Invoices'],
  drafts:    ['AI Outreach Drafts', 'Home / Outreach'],
  reasoning: ['Agent Reasoning Log', 'Home / Intelligence'],
  settings:  ['Settings', 'Home / Settings'],
};

const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export default function App() {
  const [view, setView] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recoverable');
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setInvoices(data.invoices);
      setSummary(data.summary);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const rerunAgent = async (btn) => {
    try {
      const r = await fetch('/api/recoverable', { method: 'POST' });
      const d = await r.json();
      showToast(d.error ? 'Agent error: ' + d.error : 'Agent re-run complete');
      setTimeout(() => loadData(), 1200);
    } catch (e) {
      showToast('Agent re-run failed: ' + e.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && view === 'invoices') {
        // handled in Invoices component
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [view]);

  const navigate = (v) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [title, crumb] = VIEW_META[view];
  const draftsCount = invoices.filter(i => i.draft_email).length;

  const exportCSV = () => {
    if (!invoices.length) { showToast('No data to export yet'); return; }
    const head = ['id','customer','email','amount','status','failure_reason','recovery_score','best_channel','retry_in_days'];
    const lines = [head.join(',')].concat(invoices.map(i =>
      head.map(k => '"' + String(i[k] === null || i[k] === undefined ? '' : i[k]).replace(/"/g, '""') + '"').join(',')
    ));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'revive_recovery_report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Exported ' + invoices.length + ' invoices to CSV');
  };

  return (
    <>
      <Sidebar view={view} navigate={navigate} invoicesCount={invoices.length} draftsCount={draftsCount} />
      <div className="main">
        <Topbar
          title={title}
          crumb={crumb}
          onExport={exportCSV}
          onRerun={rerunAgent}
          onAvatar={() => navigate('settings')}
          showToast={showToast}
        />
        <div className="content">
          {loading && (
            <div id="loading" style={{ textAlign: 'center', padding: '80px' }}>
              <div className="loader" />
              <div className="load-text">AI Agent is analyzing invoices</div>
              <div className="load-sub">SCORING RECOVERY LIKELIHOOD &middot; SELECTING CHANNELS &middot; DRAFTING EMAILS</div>
            </div>
          )}
          {error && !loading && (
            <div id="loading" style={{ textAlign: 'center', padding: '80px' }}>
              <div className="load-text">Error: {error}</div>
            </div>
          )}
          {!loading && !error && (
            <>
              {view === 'dashboard' && <Dashboard invoices={invoices} summary={summary} fmt={fmt} navigate={navigate} />}
              {view === 'invoices' && <Invoices invoices={invoices} showToast={showToast} />}
              {view === 'drafts' && <Drafts invoices={invoices} navigate={navigate} showToast={showToast} />}
              {view === 'reasoning' && <Reasoning invoices={invoices} />}
              {view === 'settings' && <Settings invoices={invoices} fmt={fmt} />}
            </>
          )}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
