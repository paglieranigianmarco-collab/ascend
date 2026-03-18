import { useState, useEffect, useCallback } from 'react'
import {
  Zap, Plus, Trash2, Edit2, Save, X, TrendingDown, Calendar,
  Target, ArrowRight, Flame, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { api } from '../lib/api'
import { formatCurrency, formatDate, formatMonthYear } from '../lib/format'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'

export default function LoanExtinguisher() {
  const [loans, setLoans] = useState([])
  const [projections, setProjections] = useState({})
  const [extraPayments, setExtraPayments] = useState({})
  const [addOpen, setAddOpen] = useState(false)
  const [editLoan, setEditLoan] = useState(null)
  const [logPayment, setLogPayment] = useState(null)
  const [expandedProjection, setExpandedProjection] = useState(null)
  const [loading, setLoading] = useState(true)

  const emptyForm = { name: '', bank: '', original_amount: '', current_balance: '', interest_rate: '0', monthly_payment: '', start_date: '', notes: '' }
  const [form, setForm] = useState(emptyForm)
  const [payForm, setPayForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', extra_amount: '0', note: '' })

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getLoans()
      setLoans(data)
      // Auto-load projections
      const extras = {}
      for (const loan of data) {
        extras[loan.id] = extraPayments[loan.id] || 0
      }
      setExtraPayments(extras)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function loadProjection(loanId, extra = 0) {
    try {
      const proj = await api.loanProjection(loanId, extra)
      setProjections(p => ({ ...p, [loanId]: proj }))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    for (const loan of loans) {
      loadProjection(loan.id, extraPayments[loan.id] || 0)
    }
  }, [loans])

  async function handleAddLoan(e) {
    e.preventDefault()
    await api.addLoan({
      ...form,
      original_amount: parseFloat(form.original_amount),
      current_balance: parseFloat(form.current_balance),
      interest_rate: parseFloat(form.interest_rate) || 0,
      monthly_payment: parseFloat(form.monthly_payment),
    })
    setAddOpen(false)
    setForm(emptyForm)
    refresh()
  }

  async function handleEditLoan(e) {
    e.preventDefault()
    await api.updateLoan(editLoan.id, {
      ...form,
      original_amount: parseFloat(form.original_amount),
      current_balance: parseFloat(form.current_balance),
      interest_rate: parseFloat(form.interest_rate) || 0,
      monthly_payment: parseFloat(form.monthly_payment),
    })
    setEditLoan(null)
    setForm(emptyForm)
    refresh()
  }

  async function handleDeleteLoan(id) {
    if (!confirm('Delete this loan?')) return
    await api.deleteLoan(id)
    refresh()
  }

  async function handleLogPayment(e) {
    e.preventDefault()
    await api.logPayment(logPayment.id, {
      date: payForm.date,
      amount: parseFloat(payForm.amount),
      extra_amount: parseFloat(payForm.extra_amount) || 0,
      note: payForm.note,
    })
    setLogPayment(null)
    setPayForm({ date: new Date().toISOString().slice(0, 10), amount: '', extra_amount: '0', note: '' })
    refresh()
  }

  function openEdit(loan) {
    setEditLoan(loan)
    setForm({
      name: loan.name, bank: loan.bank,
      original_amount: loan.original_amount, current_balance: loan.current_balance,
      interest_rate: loan.interest_rate, monthly_payment: loan.monthly_payment,
      start_date: loan.start_date || '', notes: loan.notes || '',
    })
  }

  const totalDebt = loans.reduce((s, l) => s + l.current_balance, 0)
  const totalOriginal = loans.reduce((s, l) => s + l.original_amount, 0)
  const overallProgress = totalOriginal > 0 ? ((totalOriginal - totalDebt) / totalOriginal) * 100 : 0

  // Build combined projection chart for all loans
  function buildCombinedChart() {
    const allSchedules = loans.map(l => ({
      loan: l,
      schedule: projections[l.id]?.attack?.schedule || [],
      color: ['#7c6af5', '#22d3a0'][loans.indexOf(l) % 2],
    }))
    if (!allSchedules[0]?.schedule.length) return []
    const maxLen = Math.max(...allSchedules.map(s => s.schedule.length))
    return Array.from({ length: maxLen }, (_, i) => {
      const obj = { month: i + 1 }
      for (const s of allSchedules) {
        obj[s.loan.name] = s.schedule[i]?.balance ?? 0
      }
      return obj
    })
  }

  const combinedChart = buildCombinedChart()

  const LOAN_COLORS = ['#7c6af5', '#22d3a0', '#f59e0b', '#f87171']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Flame size={22} className="text-accent-light" />
            Loan Extinguisher
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Attack mode · Accelerated debt freedom</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={14} /> Add Loan
        </button>
      </div>

      {/* Overall Progress */}
      {loans.length > 0 && (
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-green-ladder/5 pointer-events-none rounded-2xl" />
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="stat-label">Total Remaining Debt</p>
              <p className="text-3xl font-display font-extrabold text-red-ladder number-mono mt-1">{formatCurrency(totalDebt)}</p>
              <p className="text-sm text-white/40 mt-1">Originally {formatCurrency(totalOriginal)} · {overallProgress.toFixed(1)}% paid off</p>
            </div>
            <div className="text-right">
              <p className="stat-label">Monthly Commitment</p>
              <p className="text-xl font-display font-bold text-white number-mono mt-1">
                {formatCurrency(loans.reduce((s, l) => s + l.monthly_payment, 0))}
              </p>
            </div>
          </div>
          <div className="progress-bar h-2.5">
            <div
              className="progress-bar-fill"
              style={{
                width: `${overallProgress}%`,
                background: 'linear-gradient(90deg, #7c6af5, #22d3a0)',
              }}
            />
          </div>
        </div>
      )}

      {/* Combined Projection Chart */}
      {loans.length > 0 && combinedChart.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-white">Combined Payoff Trajectory</h3>
            <span className="badge badge-purple flex items-center gap-1"><Zap size={10} /> Attack Mode</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={combinedChart} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                {loans.map((loan, i) => (
                  <linearGradient key={loan.id} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={LOAN_COLORS[i]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={LOAN_COLORS[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `M${v}`} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1f2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [formatCurrency(v), '']}
                labelFormatter={v => `Month ${v}`}
              />
              <Legend formatter={v => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>} />
              {loans.map((loan, i) => (
                <Area
                  key={loan.id}
                  type="monotone"
                  dataKey={loan.name}
                  stroke={LOAN_COLORS[i]}
                  strokeWidth={2}
                  fill={`url(#grad${i})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Individual Loans */}
      {loans.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={TrendingDown}
            title="No loans tracked"
            description="Add your loans to start the extinguisher"
            action={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} className="inline mr-1" /> Add First Loan</button>}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan, loanIdx) => {
            const proj = projections[loan.id]
            const extra = extraPayments[loan.id] || 0
            const progress = loan.original_amount > 0 ? Math.min(100, ((loan.original_amount - loan.current_balance) / loan.original_amount) * 100) : 0
            const isExpanded = expandedProjection === loan.id

            return (
              <div key={loan.id} className="card overflow-hidden">
                {/* Loan Header */}
                <div className="p-5 border-b border-white/[0.05]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${LOAN_COLORS[loanIdx]}20` }}>
                        <TrendingDown size={18} style={{ color: LOAN_COLORS[loanIdx] }} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-white">{loan.name}</h3>
                        <p className="text-xs text-white/40">{loan.bank} · {loan.interest_rate}% APR</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setLogPayment(loan); setPayForm(f => ({ ...f, amount: String(loan.monthly_payment) })) }} className="btn-ghost text-xs py-1.5">
                        <DollarSign size={12} className="inline mr-1" /> Log Payment
                      </button>
                      <button onClick={() => openEdit(loan)} className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition-colors">
                        <Edit2 size={13} className="text-white/40" />
                      </button>
                      <button onClick={() => handleDeleteLoan(loan.id)} className="w-8 h-8 rounded-xl bg-red-ladder/10 hover:bg-red-ladder/20 flex items-center justify-center transition-colors">
                        <Trash2 size={13} className="text-red-ladder" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="stat-label">Balance</p>
                      <p className="text-lg font-display font-bold text-red-ladder number-mono">{formatCurrency(loan.current_balance)}</p>
                    </div>
                    <div>
                      <p className="stat-label">Monthly</p>
                      <p className="text-lg font-display font-bold text-white number-mono">{formatCurrency(loan.monthly_payment)}</p>
                    </div>
                    <div>
                      <p className="stat-label">Progress</p>
                      <p className="text-lg font-display font-bold text-green-ladder number-mono">{progress.toFixed(1)}%</p>
                    </div>
                    {proj && (
                      <div>
                        <p className="stat-label">Payoff Date</p>
                        <p className="text-sm font-display font-bold text-white number-mono">{formatMonthYear(proj.attack.payoff_date)}</p>
                      </div>
                    )}
                  </div>

                  <div className="progress-bar h-2 mt-3">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%`, backgroundColor: LOAN_COLORS[loanIdx] }}
                    />
                  </div>
                </div>

                {/* Attack Calculator */}
                <div className="p-5 bg-surface-3/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} className="text-accent-light" />
                    <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Attack Calculator</span>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="label">Extra Monthly Payment (€)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        className="input"
                        placeholder="0"
                        value={extra || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0
                          setExtraPayments(p => ({ ...p, [loan.id]: val }))
                        }}
                      />
                    </div>
                    <button
                      className="btn-primary flex items-center gap-1.5 whitespace-nowrap"
                      onClick={() => {
                        loadProjection(loan.id, extra)
                        setExpandedProjection(loan.id)
                      }}
                    >
                      <Target size={13} /> Calculate
                    </button>
                    {proj && (
                      <button
                        className="btn-ghost flex items-center gap-1.5"
                        onClick={() => setExpandedProjection(isExpanded ? null : loan.id)}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Chart
                      </button>
                    )}
                  </div>

                  {/* Projection Summary */}
                  {proj && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-surface-2 p-3 border border-white/[0.04]">
                        <p className="stat-label">Standard Payoff</p>
                        <p className="text-sm font-bold text-white number-mono">{formatMonthYear(proj.base.payoff_date)}</p>
                        <p className="text-xs text-white/30 mt-0.5">{proj.base.months} months</p>
                      </div>
                      <div className="rounded-xl p-3 border" style={{ background: `${LOAN_COLORS[loanIdx]}10`, borderColor: `${LOAN_COLORS[loanIdx]}30` }}>
                        <p className="stat-label">Attack Payoff</p>
                        <p className="text-sm font-bold number-mono" style={{ color: LOAN_COLORS[loanIdx] }}>{formatMonthYear(proj.attack.payoff_date)}</p>
                        <p className="text-xs text-white/30 mt-0.5">{proj.attack.months} months</p>
                      </div>
                      <div className="rounded-xl bg-green-ladder/10 border border-green-ladder/20 p-3">
                        <p className="stat-label text-green-ladder/70">You Save</p>
                        <p className="text-sm font-bold text-green-ladder number-mono">{formatCurrency(proj.interest_saved)}</p>
                        <p className="text-xs text-green-ladder/50 mt-0.5">{proj.months_saved} months earlier</p>
                      </div>
                    </div>
                  )}

                  {/* Projection Chart */}
                  {isExpanded && proj && (
                    <div className="mt-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="atkGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={LOAN_COLORS[loanIdx]} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={LOAN_COLORS[loanIdx]} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `M${v}`} />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                          <Tooltip
                            contentStyle={{ background: '#1f2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                            formatter={(v) => [formatCurrency(v), '']}
                            labelFormatter={v => `Month ${v}`}
                          />
                          <Legend formatter={v => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>} />
                          <Area data={proj.base.schedule} type="monotone" dataKey="balance" name="Standard" stroke="#f87171" strokeWidth={1.5} fill="url(#baseGrad)" dot={false} />
                          <Area data={proj.attack.schedule} type="monotone" dataKey="balance" name="Attack" stroke={LOAN_COLORS[loanIdx]} strokeWidth={2} fill="url(#atkGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Loan Modal */}
      {addOpen && (
        <Modal title="Add Loan" onClose={() => { setAddOpen(false); setForm(emptyForm) }} size="md">
          <LoanForm form={form} setForm={setForm} onSubmit={handleAddLoan} onCancel={() => { setAddOpen(false); setForm(emptyForm) }} />
        </Modal>
      )}

      {/* Edit Loan Modal */}
      {editLoan && (
        <Modal title={`Edit · ${editLoan.name}`} onClose={() => { setEditLoan(null); setForm(emptyForm) }} size="md">
          <LoanForm form={form} setForm={setForm} onSubmit={handleEditLoan} onCancel={() => { setEditLoan(null); setForm(emptyForm) }} isEdit />
        </Modal>
      )}

      {/* Log Payment Modal */}
      {logPayment && (
        <Modal title={`Log Payment · ${logPayment.name}`} onClose={() => setLogPayment(null)} size="sm">
          <form onSubmit={handleLogPayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Base Payment (€)</label>
                <input type="number" step="0.01" className="input" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Extra Amount (€)</label>
                <input type="number" step="0.01" className="input" value={payForm.extra_amount} onChange={e => setPayForm(f => ({ ...f, extra_amount: e.target.value }))} />
              </div>
              <div>
                <label className="label">Note</label>
                <input type="text" className="input" placeholder="Optional" value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setLogPayment(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Log Payment</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function LoanForm({ form, setForm, onSubmit, onCancel, isEdit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Loan Name</label>
          <input type="text" className="input" placeholder="e.g. Car Loan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Bank / Lender</label>
          <input type="text" className="input" placeholder="e.g. Findomestic" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Original Amount (€)</label>
          <input type="number" step="0.01" className="input" placeholder="0" value={form.original_amount} onChange={e => setForm(f => ({ ...f, original_amount: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Current Balance (€)</label>
          <input type="number" step="0.01" className="input" placeholder="0" value={form.current_balance} onChange={e => setForm(f => ({ ...f, current_balance: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Interest Rate (%)</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} />
        </div>
        <div>
          <label className="label">Monthly Payment (€)</label>
          <input type="number" step="0.01" className="input" placeholder="0" value={form.monthly_payment} onChange={e => setForm(f => ({ ...f, monthly_payment: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div>
          <label className="label">Notes</label>
          <input type="text" className="input" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">{isEdit ? 'Save Changes' : 'Add Loan'}</button>
      </div>
    </form>
  )
}
