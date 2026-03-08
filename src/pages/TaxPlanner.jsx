import { useLocalStorageData } from '../hooks/useLocalStorageData';
import './TaxPlanner.css';

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_QUARTERS = [
    { quarter: 1, type: 'quarterly', label: 'Q1', due: `${CURRENT_YEAR}-03-31` },
    { quarter: 2, type: 'quarterly', label: 'Q2', due: `${CURRENT_YEAR}-06-30` },
    { quarter: 3, type: 'quarterly', label: 'Q3', due: `${CURRENT_YEAR}-09-30` },
    { quarter: 4, type: 'quarterly', label: 'Q4', due: `${CURRENT_YEAR}-12-31` },
    { quarter: 0, type: 'annual', label: 'Annual', due: `${CURRENT_YEAR + 1}-06-30` },
];

export default function TaxPlanner() {
    const { data: taxes, addItem, updateItem } = useLocalStorageData('taxes');

    const yearTaxes = DEFAULT_QUARTERS.map(q => {
        const existing = taxes.find(t => t.year === CURRENT_YEAR && t.quarter === q.quarter);
        return existing || {
            id: null,
            year: CURRENT_YEAR,
            quarter: q.quarter,
            type: q.type,
            estimated_amount: 0,
            billed_amount: 0,
            paid_amount: 0,
            status: 'Estimated',
            due_date: q.due,
            ...q,
        };
    });

    const totalEstimated = yearTaxes.reduce((s, t) => s + (t.estimated_amount || 0), 0);
    const totalPaid = yearTaxes.reduce((s, t) => s + (t.paid_amount || 0), 0);
    const progressPct = totalEstimated > 0 ? Math.min((totalPaid / totalEstimated) * 100, 100) : 0;

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n || 0);

    const saveTax = (tax, updates) => {
        if (tax.id) {
            updateItem(tax.id, updates);
        } else {
            addItem({ ...tax, ...updates, year: CURRENT_YEAR });
        }
    };

    return (
        <div className="tax-planner">
            <div className="page-header fade-in">
                <h1>Tax Planner</h1>
                <p>Track quarterly prepayments and annual settlement for {CURRENT_YEAR}</p>
            </div>

            {/* Progress overview */}
            <div className="card fade-in fade-in-delay-1 tax-progress-card" id="tax-progress">
                <div className="card-header">
                    <h3><span className="icon">🎯</span> Funds Set Aside</h3>
                    <span className="tax-progress-label">{fmt(totalPaid)} of {fmt(totalEstimated)}</span>
                </div>
                <div className="progress-bar-container large">
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="tax-progress-pct">{progressPct.toFixed(0)}% allocated</div>
            </div>

            {/* Quarter cards */}
            <div className="tax-quarters fade-in fade-in-delay-2">
                {yearTaxes.map((tax) => {
                    const qLabel = tax.label || (tax.quarter === 0 ? 'Annual' : `Q${tax.quarter}`);
                    return (
                        <div className="card tax-quarter-card" key={tax.quarter} id={`tax-quarter-${tax.quarter}`}>
                            <div className="quarter-header">
                                <h3>{qLabel} {tax.type === 'annual' ? 'Settlement' : 'Prepayment'}</h3>
                                <span className={`status-tag ${tax.status.toLowerCase()}`}>
                                    {tax.status}
                                </span>
                            </div>

                            <div className="quarter-due">
                                Due: {tax.due_date ? new Date(tax.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </div>

                            <div className="quarter-amounts">
                                <div className="input-group">
                                    <label>Estimated</label>
                                    <input
                                        type="number"
                                        placeholder="€0"
                                        defaultValue={tax.estimated_amount || ''}
                                        onBlur={e => saveTax(tax, { estimated_amount: +e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Billed</label>
                                    <input
                                        type="number"
                                        placeholder="€0"
                                        defaultValue={tax.billed_amount || ''}
                                        onBlur={e => saveTax(tax, { billed_amount: +e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Paid</label>
                                    <input
                                        type="number"
                                        placeholder="€0"
                                        defaultValue={tax.paid_amount || ''}
                                        onBlur={e => saveTax(tax, { paid_amount: +e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="quarter-actions">
                                <select
                                    value={tax.status}
                                    onChange={e => saveTax(tax, { status: e.target.value })}
                                    className="status-select"
                                >
                                    <option value="Estimated">Estimated</option>
                                    <option value="Billed">Billed</option>
                                    <option value="Paid">Paid</option>
                                </select>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
