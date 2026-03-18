import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, TrendingUp, BarChart3, Coins, Layers, Gem } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { api } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/format'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'

const CATS = {
  stocks: { label: 'Stocks',      color: '#3B82F6', icon: TrendingUp,  bg: 'rgba(59,130,246,0.12)'  },
  btc:    { label: 'Bitcoin',     color: '#F7931A', icon: Coins,       bg: 'rgba(247,147,26,0.12)'  },
  eth:    { label: 'Ethereum',    color: '#627EEA', icon: Gem,         bg: 'rgba(98,126,234,0.12)'  },
  crypto: { label: 'Crypto',      color: '#14B8A6', icon: Layers,      bg: 'rgba(20,184,166,0.12)'  },
  etf:    { label: 'ETF',         color: '#22C55E', icon: BarChart3,   bg: 'rgba(34,197,94,0.12)'   },
}
const CAT_KEYS = Object.keys(CATS)
const YEAR = new Date().getFullYear()

function CategoryBadge({ cat, size = 'md' }) {
  const c = CATS[cat]
  if (!c) return null
  const Icon = c.icon
  const cls = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs gap-1.5'
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${cls}`}
      style={{ background: c.bg, color: c.color }}>
      <Icon size={size === 'sm' ? 10 : 11} />
      {c.label}
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white/60 font-medium mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span style={{ color: p.fill }} className="font-semibold">{CATS[p.dataKey]?.label || p.dataKey}</span>
          <span className="text-white ml-auto font-mono">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Investments() {
  const [entries, setEntries]   = useState([])
  const [summary, setSummary]   = useState(null)
  const [monthly, setMonthly]   = useState([])
  const [addOpen, setAddOpen]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filter, setFilter]     = useState('all')

  const emptyForm = { date: new Date().toISOString().slice(0, 10), category: 'etf', amount: '', platform: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  const refresh = useCallback(async () => {
    const [ent, sum, mon] = await Promise.all([
      api.getInvEntries(),
      api.invSummary(),
      api.invMonthly(YEAR),
    ])
    setEntries(ent)
    setSummary(sum)
    setMonthly(mon)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleAdd(e) {
    e.preventDefault()
    await api.addInvEntry({ ...form, amount: parseFloat(form.amount) || 0 })
    setAddOpen(false); setForm(emptyForm); refresh()
  }

  async function handleEdit(e) {
    e.preventDefault()
    await api.updateInvEntry(editItem.id, { ...form, amount: parseFloat(form.amount) || 0 })
    setEditItem(null); setForm(emptyForm); refresh()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return
    await api.deleteInvEntry(id); refresh()
  }

  function openEdit(entry) {
    setEditItem(entry)
    setForm({ date: entry.date, category: entry.category, amount: String(entry.amount), platform: entry.platform || '', notes: entry.notes || '' })
  }

  // Pie data — only categories with investments
  const pieData = summary
    ? CAT_KEYS.filter(c => (summary.by_category[c] || 0) > 0)
        .map(c => ({ name: c, label: CATS[c].label, value: summary.by_category[c] }))
    : []

  const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.category === filter)

  // Only show months with data for bar chart
  const barData = monthly.filter(m => m.total > 0)

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Portfolio</h1>
          <p className="text-sm text-white/40 mt-0.5">Long-term wealth building · Track what you invest</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={14} /> Log Investment
        </button>
      </div>

      {/* Hero Stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none rounded-2xl" />
            <p className="stat-label">Total Invested</p>
            <p className="text-3xl font-display font-extrabold gradient-text number-mono mt-1">{formatCurrency(summary.total)}</p>
            <p className="text-xs text-white/30 mt-1">lifetime contributions</p>
          </div>
          <div className="card p-5">
            <p className="stat-label">This Month</p>
            <p className="text-3xl font-display font-extrabold text-white number-mono mt-1">{formatCurrency(summary.this_month)}</p>
            <p className="text-xs text-white/30 mt-1">invested so far</p>
          </div>
          <div className="card p-5">
            <p className="stat-label">This Year ({YEAR})</p>
            <p className="text-3xl font-display font-extrabold text-white number-mono mt-1">{formatCurrency(summary.this_year)}</p>
            <p className="text-xs text-white/30 mt-1">total contributions</p>
          </div>
        </div>
      )}

      {/* Category Breakdown Row */}
      {summary && (
        <div className="grid grid-cols-5 gap-3">
          {CAT_KEYS.map(cat => {
            const c = CATS[cat]
            const Icon = c.icon
            const amount = summary.by_category[cat] || 0
            const pct = summary.total > 0 ? ((amount / summary.total) * 100).toFixed(1) : '0.0'
            return (
              <div key={cat} className="card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
                    <Icon size={15} style={{ color: c.color }} />
                  </div>
                  <span className="text-xs font-bold number-mono" style={{ color: c.color }}>{pct}%</span>
                </div>
                <div>
                  <p className="text-xs text-white/40 font-medium">{c.label}</p>
                  <p className="text-sm font-display font-bold text-white number-mono mt-0.5">{formatCurrency(amount)}</p>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Charts */}
      {entries.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          {/* Donut */}
          <div className="col-span-2 card p-5">
            <h3 className="font-display font-bold text-sm text-white mb-4">Allocation</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={CATS[entry.name].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1b22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                    formatter={(v, name) => [formatCurrency(v), CATS[name]?.label || name]}
                  />
                  <Legend
                    formatter={(v) => <span style={{ color: CATS[v]?.color || 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>{CATS[v]?.label || v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-white/20 text-sm">No data yet</div>
            )}
          </div>

          {/* Monthly Stacked Bar */}
          <div className="col-span-3 card p-5">
            <h3 className="font-display font-bold text-sm text-white mb-4">Monthly Contributions {YEAR}</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v ? `€${(v/1000).toFixed(0)}k` : ''} />
                  <Tooltip content={<CustomTooltip />} />
                  {CAT_KEYS.map(cat => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={CATS[cat].color} radius={cat === 'etf' ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-white/20 text-sm">Start logging investments to see your chart</div>
            )}
          </div>
        </div>
      )}

      {/* Entry Log */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-white">Investment Log</h3>
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filter === 'all' ? 'bg-accent/20 text-accent-light' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
            >All</button>
            {CAT_KEYS.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? 'all' : cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all`}
                style={filter === cat ? { background: CATS[cat].bg, color: CATS[cat].color } : { color: 'rgba(255,255,255,0.4)' }}
              >
                {CATS[cat].label}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={BarChart3}
              title="No investments logged yet"
              description="Track each investment you make — stocks, BTC, ETH, crypto, or ETF"
              action={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} className="inline mr-1" /> Log First Investment</button>}
            />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CATS[entry.category]?.bg }}>
                  {CATS[entry.category] && (() => { const Icon = CATS[entry.category].icon; return <Icon size={14} style={{ color: CATS[entry.category].color }} /> })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CategoryBadge cat={entry.category} size="sm" />
                    {entry.platform && <span className="text-xs text-white/30 font-medium">{entry.platform}</span>}
                  </div>
                  {entry.notes && <p className="text-xs text-white/30 mt-0.5 truncate">{entry.notes}</p>}
                </div>
                <p className="text-xs text-white/30 flex-shrink-0">{formatDate(entry.date)}</p>
                <p className="text-base font-display font-bold text-white number-mono flex-shrink-0 w-28 text-right">{formatCurrency(entry.amount)}</p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(entry)} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition-colors">
                    <Edit2 size={11} className="text-white/40" />
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="w-7 h-7 rounded-lg bg-red-ladder/10 hover:bg-red-ladder/20 flex items-center justify-center transition-colors">
                    <Trash2 size={11} className="text-red-ladder" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {addOpen && (
        <Modal title="Log Investment" onClose={() => { setAddOpen(false); setForm(emptyForm) }} size="sm">
          <InvForm form={form} setForm={setForm} onSubmit={handleAdd} onCancel={() => { setAddOpen(false); setForm(emptyForm) }} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Modal title="Edit Entry" onClose={() => { setEditItem(null); setForm(emptyForm) }} size="sm">
          <InvForm form={form} setForm={setForm} onSubmit={handleEdit} onCancel={() => { setEditItem(null); setForm(emptyForm) }} isEdit />
        </Modal>
      )}
    </div>
  )
}

function InvForm({ form, setForm, onSubmit, onCancel, isEdit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CAT_KEYS.map(cat => <option key={cat} value={cat}>{CATS[cat].label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Amount Invested (€)</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Platform</label>
          <input type="text" className="input" placeholder="Revolut, Binance..." value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <input type="text" className="input" placeholder="e.g. Monthly DCA, lump sum..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">{isEdit ? 'Save Changes' : 'Log Investment'}</button>
      </div>
    </form>
  )
}
