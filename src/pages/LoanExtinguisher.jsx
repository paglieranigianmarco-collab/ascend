import { useState, useEffect } from 'react';
import { useLocalStorageData } from '../hooks/useLocalStorageData';
import './LoanExtinguisher.css';

export default function LoanExtinguisher() {
    const { data: loans, addItem, updateItem } = useLocalStorageData('loans');

    const loanSlots = [0, 1].map(i => loans[i] || null);

    const saveLoan = (loan, updates) => {
        if (loan && loan.id) {
            updateItem(loan.id, updates);
        }
    };

    const createLoan = (name) => {
        addItem({ name, total_amount: 0, remaining_balance: 0, interest_rate: 0, base_payment: 0, extra_payment: 0 });
    };

    return (
        <div className="loan-extinguisher">
            <div className="page-header fade-in">
                <h1>Loan Extinguisher</h1>
                <p>Accelerate your payoff with extra overpayments</p>
            </div>

            <div className="grid-2 fade-in fade-in-delay-1">
                {loanSlots.map((loan, idx) => (
                    <LoanSection
                        key={idx}
                        index={idx}
                        loan={loan}
                        onSave={(updates) => saveLoan(loan, updates)}
                        onCreate={() => createLoan(`Loan ${idx + 1}`)}
                    />
                ))}
            </div>
        </div>
    );
}

function LoanSection({ index, loan, onSave, onCreate }) {
    const [form, setForm] = useState({
        name: '', total_amount: '', remaining_balance: '', interest_rate: '', base_payment: '', extra_payment: '',
    });

    useEffect(() => {
        if (loan) setForm({
            name: loan.name || '', total_amount: loan.total_amount || '', remaining_balance: loan.remaining_balance || '',
            interest_rate: loan.interest_rate || '', base_payment: loan.base_payment || '', extra_payment: loan.extra_payment || '',
        });
    }, [loan]);

    const handleBlur = (field, value) => {
        if (loan) onSave({ [field]: field === 'name' ? value : +value });
    };

    // Projection calc
    const monthlyPayment = (+form.base_payment || 0) + (+form.extra_payment || 0);
    const remaining = +form.remaining_balance || 0;
    const rate = (+form.interest_rate || 0) / 100 / 12;
    let monthsToPayoff = 0;
    if (monthlyPayment > 0 && remaining > 0) {
        if (rate > 0) {
            monthsToPayoff = Math.ceil(-Math.log(1 - (rate * remaining) / monthlyPayment) / Math.log(1 + rate));
            if (isNaN(monthsToPayoff) || monthsToPayoff < 0) monthsToPayoff = 0;
        } else {
            monthsToPayoff = Math.ceil(remaining / monthlyPayment);
        }
    }
    const payoffDate = monthsToPayoff > 0
        ? new Date(Date.now() + monthsToPayoff * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
        : '—';

    const total = +form.total_amount || 0;
    const paidOff = total > 0 ? ((total - remaining) / total) * 100 : 0;

    if (!loan) {
        return (
            <div className="card loan-card loan-empty">
                <div className="loan-empty-content">
                    <span className="loan-empty-icon">🏦</span>
                    <h3>Loan {index + 1}</h3>
                    <p>No loan configured yet</p>
                    <button className="btn btn-primary" onClick={onCreate}>+ Add Loan</button>
                </div>
            </div>
        );
    }

    return (
        <div className="card loan-card">
            <div className="card-header">
                <h3><span className="icon">🏦</span> Loan {index + 1}</h3>
                <span className="loan-payoff-badge">{monthsToPayoff > 0 ? `~${monthsToPayoff} mo` : '—'}</span>
            </div>

            <div className="input-group">
                <label>Loan Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onBlur={e => handleBlur('name', e.target.value)} placeholder="e.g. Home Mortgage" />
            </div>

            <div className="loan-figures">
                <div className="input-group"><label>Total Amount</label><input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} onBlur={e => handleBlur('total_amount', e.target.value)} placeholder="€0" /></div>
                <div className="input-group"><label>Remaining Balance</label><input type="number" value={form.remaining_balance} onChange={e => setForm(f => ({ ...f, remaining_balance: e.target.value }))} onBlur={e => handleBlur('remaining_balance', e.target.value)} placeholder="€0" /></div>
                <div className="input-group"><label>Interest Rate (%)</label><input type="number" step="0.01" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} onBlur={e => handleBlur('interest_rate', e.target.value)} placeholder="0.00" /></div>
            </div>

            <div className="loan-progress">
                <div className="loan-progress-header"><span>Paid Off</span><span>{paidOff.toFixed(0)}%</span></div>
                <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: `${paidOff}%` }} /></div>
            </div>

            <div className="loan-payments">
                <div className="input-group"><label>Base Payment / mo</label><input type="number" value={form.base_payment} onChange={e => setForm(f => ({ ...f, base_payment: e.target.value }))} onBlur={e => handleBlur('base_payment', e.target.value)} placeholder="€0" /></div>
                <div className="input-group"><label>Extra Overpayment / mo</label><input type="number" value={form.extra_payment} onChange={e => setForm(f => ({ ...f, extra_payment: e.target.value }))} onBlur={e => handleBlur('extra_payment', e.target.value)} placeholder="€0" /></div>
            </div>

            <div className="chart-placeholder">
                <span className="icon">📉</span><span>Accelerated Payoff Projection</span>
                <span className="chart-payoff-date">Est. payoff: <strong>{payoffDate}</strong></span>
            </div>
        </div>
    );
}
