import { useState, useEffect, useCallback } from 'react'
import {
  PieChart as PieIcon, Plus, Trash2, Edit2, TrendingUp, TrendingDown, Globe, ExternalLink
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'

const TYPE_COLORS = {
  crypto: '#7c6af5',
  stock: '#22d3a0',
  etf: '#f59e0b',
  other: '#94a3b8',
}

export default function Investments() {
  const [investments, setInvestments] = useState([])
  const [summary, setSummary] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const emptyForm = { type: 'crypto', symbol: '', name: '', quantity: '', avg_buy_price: '', current_price: '', platform: '', wallet_address: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  const refresh = useCallback(async () => {
    const [inv, sum] = await Promise.all([api.getInvestments(), api.investmentSummary()])
    setInvestments(inv)
    setSummary(sum)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleAdd(e) {
    e.preventDefault()
    await api.addInvestment({
      ...form,
      quantity: parseFloat(form.quantity) || 0,
      avg_buy_price: parseFloat(form.avg_buy_price) || 0,
      current_price: parseFloat(form.current_price) || 0,
    })
    setAddOpen(false)
    setForm(emptyForm)
    refresh()
  }

  async function handleEdit(e) {
    e.preventDefault()
    await api.updateInvestment(editItem.id, {
      ...form,
      quantity: parseFloat(form.quantity) || 0,
      avg_buy_price: parseFloat(form.avg_buy_price) || 0,
      current_price: parseFloat(form.current_price) || 0,
    })
    setEditItem(null)
    setForm(emptyForm)
    refresh()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this investment?')) return
    await api.deleteInvestment(id)
    refresh()
  }

  function openEdit(inv) {
    setEditItem(inv)
    setForm({ ...inv, quantity: String(inv.quantity), avg_buy_price: String(inv.avg_buy_price), current_price: String(inv.current_price) })
  }

  // Group by type for pie
  const byType = investments.reduce((acc, inv) => {
    const val = inv.quantity * inv.current_price
    acc[inv.type] = (acc[inv.type] || 0) + val
    return acc
  }, {})
  const pieData = Object.entries(byType).map(([name, value]) => ({ name: name.toUpperCase(), value: Math.round(value * 100) / 100 }))

  const grouped = investments.reduce((acc, inv) => {
    if (!acc[inv.type]) acc[inv.type] = []
    acc[inv.type].push(inv)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Portfolio</h1>
          <p className="text-sm text-white/40 mt-0.5">Crypto · Stocks · ETFs</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={14} /> Add Position
        </button>
      </div>

      {/* Summary Row */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Value', value: formatCurrency(summary.total_value), color: 'text-white' },
            { label: 'Total Cost', value: formatCurrency(summary.total_cost), color: 'text-white/60' },
            {
              label: 'P&L',
              value: `${summary.total_pnl >= 0 ? '+' : ''}${formatCurrency(summary.total_pnl)}`,
              color: summary.total_pnl >= 0 ? 'text-green-ladder' : 'text-red-ladder'
            },
            {
              label: 'Return %',
              value: `${summary.total_pnl_pct >= 0 ? '+' : ''}${summary.total_pnl_pct}%`,
              color: summary.total_pnl_pct >= 0 ? 'text-green-ladder' : 'text-red-ladder'
            },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <p className="stat-label">{s.label}</p>
              <p className={`text-xl font-display font-bold number-mono mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Allocation Chart + Table */}
      {investments.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {/* Pie */}
          <div className="card p-5 flex flex-col">
            <h3 className="font-display font-bold text-sm text-white mb-4">Allocation</h3>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={TYPE_COLORS[entry.name.toLowerCase()] || '#94a3b8'} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1f2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                    formatter={(v) => [formatCurrency(v), '']}
                  />
                  <Legend formatter={v => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Positions by Type */}
          <div className="col-span-2 space-y-3">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] || '#94a3b8' }} />
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{type}</span>
                  <span className="ml-auto text-xs text-white/30">{items.length} position{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {items.map(inv => {
                    const value = inv.quantity * inv.current_price
                    const cost = inv.quantity * inv.avg_buy_price
                    const pnl = value - cost
                    const pnlPct = cost > 0 ? ((pnl / cost) * 100).toFixed(1) : 0
                    const positive = pnl >= 0

                    return (
                      <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-xs font-bold text-white/60">
                          {inv.symbol.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{inv.symbol}</p>
                            <span className="text-xs text-white/30">{inv.name}</span>
                            {inv.platform && <span className="badge badge-purple text-xs py-0">{inv.platform}</span>}
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">
                            {inv.quantity} × {formatCurrency(inv.current_price)} · avg {formatCurrency(inv.avg_buy_price)}
                          </p>
                          {inv.wallet_address && (
                            <p className="text-xs text-white/20 mt-0.5 truncate font-mono">{inv.wallet_address.slice(0, 16)}…</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white number-mono">{formatCurrency(value)}</p>
                          <p className={`text-xs font-semibold number-mono ${positive ? 'text-green-ladder' : 'text-red-ladder'}`}>
                            {positive ? '+' : ''}{formatCurrency(pnl)} ({positive ? '+' : ''}{pnlPct}%)
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => openEdit(inv)} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition-colors">
                            <Edit2 size={12} className="text-white/40" />
                          </button>
                          <button onClick={() => handleDelete(inv.id)} className="w-7 h-7 rounded-lg bg-red-ladder/10 hover:bg-red-ladder/20 flex items-center justify-center transition-colors">
                            <Trash2 size={11} className="text-red-ladder" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={PieIcon}
            title="No positions yet"
            description="Add your crypto, stocks, and ETF positions"
            action={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} className="inline mr-1" /> Add Position</button>}
          />
        </div>
      )}

      {/* Add Modal */}
      {addOpen && (
        <Modal title="Add Position" onClose={() => { setAddOpen(false); setForm(emptyForm) }}>
          <InvestmentForm form={form} setForm={setForm} onSubmit={handleAdd} onCancel={() => { setAddOpen(false); setForm(emptyForm) }} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Modal title={`Edit · ${editItem.symbol}`} onClose={() => { setEditItem(null); setForm(emptyForm) }}>
          <InvestmentForm form={form} setForm={setForm} onSubmit={handleEdit} onCancel={() => { setEditItem(null); setForm(emptyForm) }} isEdit />
        </Modal>
      )}
    </div>
  )
}

function InvestmentForm({ form, setForm, onSubmit, onCancel, isEdit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="crypto">Crypto</option>
            <option value="stock">Stock</option>
            <option value="etf">ETF</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Symbol</label>
          <input type="text" className="input" placeholder="ETH, AAPL..." value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} required />
        </div>
        <div>
          <label className="label">Name</label>
          <input type="text" className="input" placeholder="Ethereum" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Platform</label>
          <input type="text" className="input" placeholder="Revolut, Binance..." value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} />
        </div>
        <div>
          <label className="label">Quantity</label>
          <input type="number" step="any" className="input" placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
        </div>
        <div>
          <label className="label">Avg Buy Price (€)</label>
          <input type="number" step="any" className="input" placeholder="0" value={form.avg_buy_price} onChange={e => setForm(f => ({ ...f, avg_buy_price: e.target.value }))} />
        </div>
        <div>
          <label className="label">Current Price (€)</label>
          <input type="number" step="any" className="input" placeholder="0" value={form.current_price} onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))} />
        </div>
        <div>
          <label className="label">Wallet Address</label>
          <input type="text" className="input" placeholder="0x..." value={form.wallet_address} onChange={e => setForm(f => ({ ...f, wallet_address: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <input type="text" className="input" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">{isEdit ? 'Save Changes' : 'Add Position'}</button>
      </div>
    </form>
  )
}
