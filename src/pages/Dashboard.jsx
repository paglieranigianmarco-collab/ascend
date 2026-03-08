import { useState, useEffect } from 'react';
import { getDashboardSummary, useLocalStorageData } from '../hooks/useLocalStorageData';
import './Dashboard.css';

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadSummary = () => {
        setSummary(getDashboardSummary());
        setLoading(false);
    };

    useEffect(() => {
        loadSummary();
        window.addEventListener('ascend_data_updated', loadSummary);
        return () => window.removeEventListener('ascend_data_updated', loadSummary);
    }, []);

    const nw = summary?.netWorth || {};
    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n || 0);

    return (
        <div className="dashboard">
            <div className="page-header fade-in">
                <h1>Dashboard</h1>
                <p>Your financial overview at a glance</p>
            </div>

            {/* ── Net Worth Calculator ── */}
            <div className="card fade-in fade-in-delay-1" id="net-worth-widget">
                <div className="card-header">
                    <h3><span className="icon">💎</span> Net Worth Calculator</h3>
                </div>
                <div className="net-worth-content">
                    <div className={`big-number ${(nw.netWorth || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {loading ? '—' : fmt(nw.netWorth)}
                    </div>
                    <p className="net-worth-formula">
                        (Crypto + Stocks + Cash) − (Loans + Taxes)
                    </p>
                    <div className="net-worth-breakdown">
                        <div className="breakdown-item positive-item">
                            <span className="breakdown-label">Crypto</span>
                            <span className="breakdown-value">{fmt(nw.cryptoValue)}</span>
                        </div>
                        <div className="breakdown-item positive-item">
                            <span className="breakdown-label">Stocks</span>
                            <span className="breakdown-value">{fmt(nw.stockValue)}</span>
                        </div>
                        <div className="breakdown-item positive-item">
                            <span className="breakdown-label">Cash</span>
                            <span className="breakdown-value">{fmt(nw.cashValue)}</span>
                        </div>
                        <div className="breakdown-divider" />
                        <div className="breakdown-item negative-item">
                            <span className="breakdown-label">Loans</span>
                            <span className="breakdown-value">−{fmt(nw.totalLoans)}</span>
                        </div>
                        <div className="breakdown-item negative-item">
                            <span className="breakdown-label">Taxes Owed</span>
                            <span className="breakdown-value">−{fmt(nw.totalTaxes)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: 24 }}>
                {/* ── Cash Flow Tracker ── */}
                <div className="card fade-in fade-in-delay-2" id="cash-flow-widget">
                    <div className="card-header">
                        <h3><span className="icon">💰</span> Cash Flow Tracker</h3>
                    </div>
                    <CashFlowTracker />
                </div>

                {/* ── Deadline Calendar ── */}
                <div className="card fade-in fade-in-delay-3" id="deadline-calendar-widget">
                    <div className="card-header">
                        <h3><span className="icon">📅</span> Deadline Calendar</h3>
                    </div>
                    <DeadlineCalendar deadlines={summary?.upcomingDeadlines || []} />
                </div>
            </div>
        </div>
    );
}

/* ── Cash Flow Tracker ──────────────────────────────────────── */

function CashFlowTracker() {
    const { data: entries, addItem } = useLocalStorageData('monthly_income');
    const [month, setMonth] = useState('');
    const [gross, setGross] = useState('');
    const [net, setNet] = useState('');
    const [source, setSource] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        addItem({ month, gross_amount: +gross, net_amount: +net, source });
        setMonth(''); setGross(''); setNet(''); setSource('');
    };

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n || 0);

    return (
        <div className="cash-flow">
            <form className="cash-flow-form" onSubmit={handleAdd}>
                <div className="input-row">
                    <div className="input-group">
                        <label>Month</label>
                        <input type="month" value={month} onChange={e => setMonth(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Gross</label>
                        <input type="number" placeholder="€0" value={gross} onChange={e => setGross(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Net</label>
                        <input type="number" placeholder="€0" value={net} onChange={e => setNet(e.target.value)} required />
                    </div>
                </div>
                <div className="input-row">
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>Source</label>
                        <input type="text" placeholder="e.g. Freelance, Salary" value={source} onChange={e => setSource(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>+ Add</button>
                </div>
            </form>

            {entries.length > 0 && (
                <div className="cash-flow-list">
                    {entries.slice(0, 5).map((item, i) => (
                        <div key={item.id || i} className="cash-flow-entry">
                            <div className="entry-month">{item.month}</div>
                            <div className="entry-source">{item.source}</div>
                            <div className="entry-amount">{fmt(item.net_amount)}</div>
                        </div>
                    ))}
                </div>
            )}

            {entries.length === 0 && (
                <div className="empty-state">
                    <span>No income entries yet. Add your first month above.</span>
                </div>
            )}
        </div>
    );
}

/* ── Deadline Calendar ──────────────────────────────────────── */

function DeadlineCalendar({ deadlines }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'No date set';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const daysUntil = (dateStr) => {
        if (!dateStr) return null;
        const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n || 0);

    return (
        <div className="deadline-calendar">
            {deadlines.length === 0 && (
                <div className="empty-state">
                    <span>No upcoming deadlines</span>
                </div>
            )}

            {deadlines.map((d, i) => {
                const days = daysUntil(d.due_date);
                const urgent = days !== null && days <= 30;
                return (
                    <div key={i} className={`deadline-item ${urgent ? 'urgent' : ''}`}>
                        <div className="deadline-icon">
                            {d.category === 'tax' ? '📋' : '🏦'}
                        </div>
                        <div className="deadline-info">
                            <div className="deadline-label">{d.label}</div>
                            <div className="deadline-date">{formatDate(d.due_date)}</div>
                        </div>
                        <div className="deadline-meta">
                            <div className="deadline-amount">{fmt(d.amount)}</div>
                            {days !== null && (
                                <div className={`deadline-countdown ${urgent ? 'urgent' : ''}`}>
                                    {days > 0 ? `${days}d` : days === 0 ? 'Today' : 'Overdue'}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
