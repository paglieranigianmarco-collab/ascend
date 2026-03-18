import { useState, useEffect, useCallback } from 'react'
import { Landmark, AlertTriangle, CheckCircle2, Clock, Edit2, Save, X, TrendingUp } from 'lucide-react'
import { api } from '../lib/api'
import { formatCurrency, formatDate, daysUntil } from '../lib/format'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'

const STATUS_CONFIG = {
  estimated: { label: 'Estimated', color: 'badge-purple', icon: Clock },
  billed:    { label: 'Billed',    color: 'badge-amber',  icon: AlertTriangle },
  paid:      { label: 'Paid',      color: 'badge-green',  icon: CheckCircle2 },
}

const YEAR = new Date().getFullYear()

export default function TaxEngine() {
  const [taxes, setTaxes] = useState([])
  const [buffer, setBuffer] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [t, b] = await Promise.all([api.getTaxes(), api.taxBuffer(YEAR)])
      setTaxes(t)
      setBuffer(b)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  function startEdit(tax) {
    setEditing(tax.id)
    setForm({
      estimated_amount: tax.estimated_amount,
      billed_amount: tax.billed_amount,
      paid_amount: tax.paid_amount,
      status: tax.status,
      notes: tax.notes || '',
      due_date: tax.due_date,
    })
  }

  async function saveEdit(id) {
    await api.updateTax(id, {
      ...form,
      estimated_amount: parseFloat(form.estimated_amount) || 0,
      billed_amount: parseFloat(form.billed_amount) || 0,
      paid_amount: parseFloat(form.paid_amount) || 0,
    })
    setEditing(null)
    refresh()
  }

  const paidTotal = taxes.reduce((s, t) => s + t.paid_amount, 0)
  const remainingTotal = Math.max(0, (buffer?.estimated_tax || 0) - paidTotal)

  const pieData = buffer ? [
    { name: 'Paid', value: paidTotal, color: '#22d3a0' },
    { name: 'Remaining', value: remainingTotal, color: '#f59e0b' },
  ] : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Tax Engine</h1>
          <p className="text-sm text-white/40 mt-0.5">4 quarterly prepayments + annual settlement</p>
        </div>
      </div>

      {/* Buffer Overview */}
      {buffer && (
        <div className="grid grid-cols-4 gap-4">
          {/* Pie chart card */}
          <div className="col-span-1 card p-5 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1f2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [formatCurrency(v), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-white/40 text-center mt-1">Tax Coverage</p>
          </div>

          <div className="card p-5">
            <p className="stat-label">Gross Income {YEAR}</p>
            <p className="text-xl font-display font-bold text-white number-mono mt-1">{formatCurrency(buffer.gross_income)}</p>
            <p className="text-xs text-white/30 mt-1">Total earned this year</p>
          </div>

          <div className="card p-5">
            <p className="stat-label">Estimated Tax ({buffer.tax_rate}%)</p>
            <p className="text-xl font-display font-bold text-amber-ladder number-mono mt-1">{formatCurrency(buffer.estimated_tax)}</p>
            <div className="progress-bar mt-3">
              <div
                className="progress-bar-fill bg-green-ladder"
                style={{ width: `${Math.min(100, (paidTotal / (buffer.estimated_tax || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-white/30 mt-1">Paid: {formatCurrency(paidTotal)}</p>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-ladder/5 to-transparent pointer-events-none rounded-2xl" />
            <p className="stat-label">Buffer Needed ({buffer.buffer_percent}%)</p>
            <p className="text-xl font-display font-bold text-amber-ladder number-mono mt-1">{formatCurrency(buffer.buffer_needed)}</p>
            <p className="text-xs text-white/30 mt-1">Keep aside from income</p>
          </div>
        </div>
      )}

      {/* Tax Periods */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <Landmark size={15} className="text-accent-light" />
          <h3 className="font-display font-bold text-sm text-white">Payment Schedule</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {taxes.map(tax => {
            const cfg = STATUS_CONFIG[tax.status] || STATUS_CONFIG.estimated
            const StatusIcon = cfg.icon
            const days = daysUntil(tax.due_date)
            const isEdit = editing === tax.id
            const progress = tax.estimated_amount > 0 ? Math.min(100, (tax.paid_amount / tax.estimated_amount) * 100) : 0

            return (
              <div key={tax.id} className="px-5 py-4">
                {!isEdit ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white">{tax.period_label}</p>
                        <span className={cfg.color}><StatusIcon size={10} className="inline mr-1" />{cfg.label}</span>
                      </div>
                      <p className="text-xs text-white/40">Due {formatDate(tax.due_date)}</p>
                      {tax.estimated_amount > 0 && (
                        <div className="progress-bar mt-2 w-48">
                          <div className="progress-bar-fill bg-green-ladder" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-right">
                      {[['Estimated', tax.estimated_amount, 'text-white/60'],
                        ['Billed', tax.billed_amount, 'text-amber-ladder'],
                        ['Paid', tax.paid_amount, 'text-green-ladder']
                      ].map(([lbl, val, cls]) => (
                        <div key={lbl}>
                          <p className="stat-label">{lbl}</p>
                          <p className={`text-sm font-bold number-mono ${cls}`}>{formatCurrency(val)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      {days !== null && (
                        <span className={`text-xs font-semibold ${days < 0 ? 'text-red-ladder' : days <= 30 ? 'text-amber-ladder' : 'text-white/30'}`}>
                          {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : `${days}d`}
                        </span>
                      )}
                      <button onClick={() => startEdit(tax)} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition-colors">
                        <Edit2 size={12} className="text-white/40" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-white">{tax.period_label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[['estimated_amount', 'Estimated (€)'], ['billed_amount', 'Billed (€)'], ['paid_amount', 'Paid (€)']].map(([key, lbl]) => (
                        <div key={key}>
                          <label className="label">{lbl}</label>
                          <input type="number" step="0.01" className="input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                        </div>
                      ))}
                      <div>
                        <label className="label">Status</label>
                        <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                          <option value="estimated">Estimated</option>
                          <option value="billed">Billed</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Due Date</label>
                        <input type="date" className="input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Notes</label>
                        <input type="text" className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(tax.id)} className="btn-primary flex items-center gap-1.5"><Save size={13} /> Save</button>
                      <button onClick={() => setEditing(null)} className="btn-ghost flex items-center gap-1.5"><X size={13} /> Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
