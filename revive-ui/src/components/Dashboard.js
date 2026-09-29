import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function Dashboard({ invoices, summary, fmt, navigate }) {
  if (!summary || !invoices.length) return null;

  const top = [...invoices].sort((a, b) => b.amount - a.amount)[0];

  const byCust = {};
  const dist = { high: 0, medium: 0, low: 0 };
  invoices.forEach(i => {
    byCust[i.customer] = (byCust[i.customer] || 0) + i.amount;
    if (i.recovery_score > 66) dist.high++;
    else if (i.recovery_score > 33) dist.medium++;
    else dist.low++;
  });
  const entries = Object.entries(byCust).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const barData = {
    labels: entries.map(e => e[0]),
    datasets: [{
      data: entries.map(e => Math.round(e[1])),
      backgroundColor: '#6366f1',
      hoverBackgroundColor: '#818cf8',
      borderRadius: 8,
      barThickness: 26,
    }],
  };
  const barOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#7c86a8', font: { size: 10 } }, grid: { display: false } },
      y: {
        ticks: {
          color: '#7c86a8',
          callback: v => '$' + (v >= 1000 ? (v / 1000) + 'k' : v),
          font: { size: 10 },
        },
        grid: { color: 'rgba(129,140,248,0.07)' },
      },
    },
  };

  const doughnutData = {
    labels: ['High (67-100)', 'Medium (34-66)', 'Low (0-33)'],
    datasets: [{
      data: [dist.high, dist.medium, dist.low],
      backgroundColor: ['#34d399', '#fbbf24', '#f472b6'],
      borderColor: 'rgba(5,6,13,0.9)',
      borderWidth: 3,
      cutout: '68%',
    }],
  };
  const doughnutOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { color: '#7c86a8', boxWidth: 10, font: { size: 10 } } },
    },
  };

  return (
    <div>
      <div className="hero fade-in">
        <div className="tag">AI REVENUE INTELLIGENCE</div>
        <p>
          The agent has analyzed <span className="hl-v">{invoices.length} invoices</span> and identified{' '}
          <span className="hl-g">{fmt(summary.projected_recovery)}</span> in recoverable revenue — {summary.recovery_rate} of total leakage.
          Largest single exposure: <span className="hl-v">{top.customer}</span>.
        </p>
        <div className="sub">Scores combine failure reason, attempt history, amount and timing. Select any invoice for the full decision trail.</div>
        <button className="btn primary cta" onClick={() => navigate('invoices')}>Review Invoices</button>
      </div>

      <div className="kpis">
        <div className="kpi fade-in" style={{ '--kc': 'var(--red)' }}>
          <div className="label">Total Revenue Leaked</div>
          <div className="value">{fmt(summary.total_leaked)}</div>
          <div className="sub">Failed and at-risk invoices</div>
        </div>
        <div className="kpi fade-in" style={{ '--kc': 'var(--green)' }}>
          <div className="label">AI-Projected Recovery</div>
          <div className="value">{fmt(summary.projected_recovery)}</div>
          <div className="sub">Invoices scoring above 40</div>
        </div>
        <div className="kpi fade-in" style={{ '--kc': 'var(--accent2)' }}>
          <div className="label">Recovery Rate</div>
          <div className="value">{summary.recovery_rate}</div>
          <div className="sub">Of total leaked revenue</div>
        </div>
        <div className="kpi fade-in" style={{ '--kc': 'var(--violet)' }}>
          <div className="label">Invoices Analyzed</div>
          <div className="value">{invoices.length}</div>
          <div className="sub">Scored by AI agent</div>
        </div>
      </div>

      <div className="charts">
        <div className="card fade-in">
          <div className="card-head"><h3>Leaked Value by Customer</h3><span className="tagx">TOP ACCOUNTS</span></div>
          <Bar data={barData} options={barOptions} height={90} />
        </div>
        <div className="card fade-in">
          <div className="card-head"><h3>Recovery Score Distribution</h3></div>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
