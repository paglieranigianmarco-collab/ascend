import { useState, useEffect } from 'react';
import './Investments.css';

export default function Investments() {
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/investments')
            .then(r => r.json())
            .then(data => { setInvestments(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const cryptos = investments.filter(i => i.type === 'crypto');
    const transfers = investments.filter(i => i.type === 'transfer');

    return (
        <div className="investments-page">
            <div className="page-header fade-in">
                <h1>Investments</h1>
                <p>Track crypto holdings and planned fiat transfers</p>
            </div>

            {/* ── Crypto Viewer ── */}
            <section className="fade-in fade-in-delay-1">
                <div className="section-header">
                    <h2>🪙 Crypto Viewer</h2>
                </div>
                <div className="grid-2">
                    <CryptoCard
                        symbol="ETH"
                        name="Ethereum"
                        logo="⟠"
                        data={cryptos.find(c => c.symbol === 'ETH')}
                        onSave={(updates) => saveCrypto('ETH', 'Ethereum', updates, investments, setInvestments)}
                    />
                    <CryptoCard
                        symbol="PLS"
                        name="Pulsechain"
                        logo="💜"
                        data={cryptos.find(c => c.symbol === 'PLS')}
                        onSave={(updates) => saveCrypto('PLS', 'Pulsechain', updates, investments, setInvestments)}
                    />
                </div>
            </section>

            {/* ── Stock Tracker / Fiat Transfers ── */}
            <section className="fade-in fade-in-delay-2" style={{ marginTop: 40 }}>
                <div className="section-header">
                    <h2>📊 Stock Tracker – Fiat Transfers</h2>
                </div>
                <StockTracker transfers={transfers} setInvestments={setInvestments} />
            </section>
        </div>
    );
}

/* ── Save helper ────────────────────────────────────────────── */

async function saveCrypto(symbol, name, updates, investments, setInvestments) {
    const existing = investments.find(i => i.type === 'crypto' && i.symbol === symbol);
    try {
        let res;
        if (existing) {
            res = await fetch(`/api/investments/${existing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
        } else {
            res = await fetch('/api/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'crypto', name, symbol, ...updates }),
            });
        }
        const saved = await res.json();
        setInvestments(prev => {
            const without = prev.filter(i => !(i.type === 'crypto' && i.symbol === symbol));
            return [...without, saved];
        });
    } catch (err) { console.error(err); }
}

/* ── Crypto Card ────────────────────────────────────────────── */

function CryptoCard({ symbol, name, logo, data, onSave }) {
    const [quantity, setQuantity] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [platform, setPlatform] = useState('');

    useEffect(() => {
        if (data) {
            setQuantity(data.quantity || '');
            setPurchasePrice(data.purchase_price || '');
            setCurrentValue(data.current_value || '');
            setPlatform(data.platform || '');
        }
    }, [data]);

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n || 0);
    const pnl = (+currentValue || 0) - (+purchasePrice || 0) * (+quantity || 0);

    return (
        <div className="card crypto-card" id={`crypto-${symbol}`}>
            <div className="crypto-header">
                <div className="crypto-logo">{logo}</div>
                <div className="crypto-identity">
                    <h3>{name}</h3>
                    <span className="crypto-symbol">{symbol}</span>
                </div>
                <div className="crypto-value-display">
                    <div className="crypto-current-val">{fmt(currentValue)}</div>
                    <div className={`crypto-pnl ${pnl >= 0 ? 'positive' : 'negative'}`}>
                        {pnl >= 0 ? '▲' : '▼'} {fmt(Math.abs(pnl))}
                    </div>
                </div>
            </div>

            <div className="crypto-fields">
                <div className="input-group">
                    <label>Quantity</label>
                    <input
                        type="number"
                        step="any"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        onBlur={e => onSave({ quantity: +e.target.value })}
                        placeholder="0.00"
                    />
                </div>
                <div className="input-group">
                    <label>Avg. Purchase Price</label>
                    <input
                        type="number"
                        step="any"
                        value={purchasePrice}
                        onChange={e => setPurchasePrice(e.target.value)}
                        onBlur={e => onSave({ purchase_price: +e.target.value })}
                        placeholder="€0"
                    />
                </div>
                <div className="input-group">
                    <label>Current Value</label>
                    <input
                        type="number"
                        step="any"
                        value={currentValue}
                        onChange={e => setCurrentValue(e.target.value)}
                        onBlur={e => onSave({ current_value: +e.target.value })}
                        placeholder="€0"
                    />
                </div>
                <div className="input-group">
                    <label>Platform</label>
                    <input
                        type="text"
                        value={platform}
                        onChange={e => setPlatform(e.target.value)}
                        onBlur={e => onSave({ platform: e.target.value })}
                        placeholder="e.g. MetaMask"
                    />
                </div>
            </div>
        </div>
    );
}

/* ── Stock Tracker / Fiat Transfers ────────────────────────── */

function StockTracker({ transfers, setInvestments }) {
    const [form, setForm] = useState({
        name: '',
        amount: '',
        platform: '',
        transfer_date: '',
        notes: '',
    });
    const [entries, setEntries] = useState(transfers);

    useEffect(() => { setEntries(transfers); }, [transfers]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'transfer',
                    name: form.name,
                    symbol: '',
                    quantity: 0,
                    purchase_price: +form.amount,
                    current_value: +form.amount,
                    platform: form.platform,
                    transfer_date: form.transfer_date,
                    notes: form.notes,
                }),
            });
            const created = await res.json();
            setEntries(prev => [created, ...prev]);
            setInvestments(prev => [...prev, created]);
            setForm({ name: '', amount: '', platform: '', transfer_date: '', notes: '' });
        } catch (err) { console.error(err); }
    };

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n || 0);

    return (
        <div className="stock-tracker">
            <div className="card" id="add-transfer-card">
                <div className="card-header">
                    <h3><span className="icon">➕</span> Log Planned Transfer</h3>
                </div>
                <form className="transfer-form" onSubmit={handleAdd}>
                    <div className="input-row">
                        <div className="input-group">
                            <label>Description</label>
                            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Monthly DCA" required />
                        </div>
                        <div className="input-group">
                            <label>Amount</label>
                            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="€0" required />
                        </div>
                        <div className="input-group">
                            <label>Platform</label>
                            <input type="text" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} placeholder="e.g. Revolut" />
                        </div>
                    </div>
                    <div className="input-row">
                        <div className="input-group">
                            <label>Transfer Date</label>
                            <input type="date" value={form.transfer_date} onChange={e => setForm(f => ({ ...f, transfer_date: e.target.value }))} />
                        </div>
                        <div className="input-group" style={{ flex: 2 }}>
                            <label>Notes</label>
                            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>+ Add</button>
                    </div>
                </form>
            </div>

            {entries.length > 0 && (
                <div className="card" style={{ marginTop: 20 }} id="transfer-list-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Platform</th>
                                <th>Date</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((t, i) => (
                                <tr key={t.id || i}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.name}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--color-billed)' }}>{fmt(t.purchase_price)}</td>
                                    <td>{t.platform || '—'}</td>
                                    <td>{t.transfer_date ? new Date(t.transfer_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{t.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
