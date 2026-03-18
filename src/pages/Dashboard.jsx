import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, Calendar,
  Plus, ArrowUpRight, ArrowDownRight, RefreshCw, DollarSign
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { api } from '../lib/api'
import { formatCurrency, formatDate, daysUntil } from '../lib/format'
import StatCard from '../components/StatCard'
import Modal from '../components/Modal'

const YEAR = new Date().getFullYear()

export default function Dashboard() {
  const [netWorth, setNetWorth] = useState(null)
  const [deadlines, setDeadlines] = useState([])
  const [cashflow, setCashflow] = useState([])
  const [loading, setLoading] = useState(true)
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [quickForm, setQuickForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', gross_amount: '', source: 'freelance', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [nw, dl, cf] = await Promise.all([
        api.netWorth(),
        api.deadlines(),
        api.cashflow(YEAR),
      ])
      setNetWorth(nw)
      setDeadlines(dl)
      setCashflow(cf)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleQuickLog(e) {
    e.preventDefault()
    if (!quickForm.amount) return
    setSubmitting(true)
    try {
      await api.addIncome({ ...quickForm, amount: parseFloat(quickForm.amount), gross_amount: quickForm.gross_amount ? parseFloat(quickForm.gross_amount) : null })
      setQuickLogOpen(false)
      setQuickForm({ date: new Date().toISOString().slice(0, 10), amount: '', gross_amount: '', source: 'freelance', description: '' })
      refresh()
    } catch (e) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const totalIncome = cashflow.reduce((s, m) => s + m.income, 0)
  const currentMonthData = cashflow[new Date().getMonth()]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Overview</h1>
          <p className="text-sm text-white/40 mt-0.5">Your financial snapshot · {YEAR}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setQuickLogOpen(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> Quick Log
          </button>
          <button onClick={refresh} className="btn-ghost flex items-center gap-1.5">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Net Worth Hero */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none rounded-2xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="stat-label">Total Net Worth</p>
            <div className="text-4xl font-display font-extrabold gradient-text number-mono mt-1">
              {loading ? '...' : formatCurrency(netWorth?.net_worth)}
            </div>
            <p className="text-sm text-white/40 mt-2">
              Assets <span className="text-green-ladder font-semibold">{formatCurrency(netWorth?.assets?.total)}</span>
              {' · '}
              Liabilities <span className="text-red-ladder font-semibold">{formatCurrency(netWorth?.liabilities?.total)}</span>
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-white/40">Cash</span>
              <span className="text-sm font-semibold text-white">{formatCurrency(netWorth?.assets?.cash)}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-white/40">Investments</span>
              <span className="text-sm font-semibold text-white">{formatCurrency(netWorth?.assets?.investments)}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-white/40">Loans</span>
              <span className="text-sm font-semibold text-red-ladder">{formatCurrency(netWorth?.liabilities?.loans)}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-white/40">Tax Liability</span>
              <span className="text-sm font-semibold text-amber-ladder">{formatCurrency(netWorth?.liabilities?.tax_accrued)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label={`Income ${YEAR}`}
          value={formatCurrency(totalIncome)}
          sub="total this year"
          icon={ArrowUpRight}
          color="green"
        />
        <StatCard
          label="This Month"
          value={formatCurrency(currentMonthData?.income)}
          sub={`Net ${formatCurrency(currentMonthData?.net)}`}
          icon={DollarSign}
          color="accent"
        />
        <StatCard
          label="Upcoming Bills"
          value={deadlines.filter(d => daysUntil(d.due_date) <= 30 && daysUntil(d.due_date) >= 0).length}
          sub="in the next 30 days"
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Cash Flow Chart + Deadline Calendar */}
      <div className="grid grid-cols-5 gap-4">
        {/* Chart */}
        <div className="col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-white">Cash Flow {YEAR}</h3>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-ladder inline-block" /> Income</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-ladder inline-block" /> Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cashflow} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1f2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                formatter={(v) => [formatCurrency(v), '']}
              />
              <Area type="monotone" dataKey="income" stroke="#22d3a0" strokeWidth={2} fill="url(#incGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Deadline Calendar */}
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-white">Upcoming Deadlines</h3>
            <Calendar size={14} className="text-white/30" />
          </div>
          <div className="space-y-2">
            {deadlines.length === 0 && (
              <p className="text-xs text-white/30 text-center py-8">No upcoming deadlines</p>
            )}
            {deadlines.map((d, i) => {
              const days = daysUntil(d.due_date)
              const urgent = days !== null && days <= 30
              const overdue = days !== null && days < 0
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-3">
                  <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${overdue ? 'bg-red-ladder' : urgent ? 'bg-amber-ladder' : 'bg-white/20'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/90 truncate">{d.label}</p>
                    <p className="text-xs text-white/40">{formatDate(d.due_date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-white/90">{formatCurrency(d.amount)}</p>
                    <p className={`text-xs font-medium ${overdue ? 'text-red-ladder' : urgent ? 'text-amber-ladder' : 'text-white/30'}`}>
                      {overdue ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : `${days}d`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Log Modal */}
      {quickLogOpen && (
        <Modal title="Log Income" onClose={() => setQuickLogOpen(false)}>
          <form onSubmit={handleQuickLog} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={quickForm.date} onChange={e => setQuickForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Net Amount (€)</label>
                <input type="number" step="0.01" className="input" placeholder="0.00" value={quickForm.amount} onChange={e => setQuickForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Gross Amount (€)</label>
                <input type="number" step="0.01" className="input" placeholder="Optional" value={quickForm.gross_amount} onChange={e => setQuickForm(f => ({ ...f, gross_amount: e.target.value }))} />
              </div>
              <div>
                <label className="label">Source</label>
                <select className="input" value={quickForm.source} onChange={e => setQuickForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="freelance">Freelance</option>
                  <option value="salary">Salary</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <input type="text" className="input" placeholder="Client, project..." value={quickForm.description} onChange={e => setQuickForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setQuickLogOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Log Income'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
