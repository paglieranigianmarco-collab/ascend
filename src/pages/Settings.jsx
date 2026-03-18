import { useState, useEffect, useCallback } from 'react'
import { Settings as SettingsIcon, Save, Plus, Trash2, Wallet } from 'lucide-react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'
import Modal from '../components/Modal'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [cashAccounts, setCashAccounts] = useState([])
  const [cashForm, setCashForm] = useState({ name: '', balance: '', currency: 'EUR', notes: '' })
  const [editCash, setEditCash] = useState(null)
  const [addCashOpen, setAddCashOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const refresh = useCallback(async () => {
    const [s, c] = await Promise.all([api.getSettings(), api.getCash()])
    setSettings(s)
    setCashAccounts(c)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function saveSettings() {
    await api.updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAddCash(e) {
    e.preventDefault()
    await api.addCash({ ...cashForm, balance: parseFloat(cashForm.balance) || 0 })
    setAddCashOpen(false)
    setCashForm({ name: '', balance: '', currency: 'EUR', notes: '' })
    refresh()
  }

  async function handleEditCash(e) {
    e.preventDefault()
    await api.updateCash(editCash.id, { ...cashForm, balance: parseFloat(cashForm.balance) || 0 })
    setEditCash(null)
    setCashForm({ name: '', balance: '', currency: 'EUR', notes: '' })
    refresh()
  }

  async function handleDeleteCash(id) {
    if (!confirm('Delete this account?')) return
    await api.deleteCash(id)
    refresh()
  }

  function openEditCash(acc) {
    setEditCash(acc)
    setCashForm({ name: acc.name, balance: String(acc.balance), currency: acc.currency, notes: acc.notes || '' })
  }

  const totalCash = cashAccounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <SettingsIcon size={20} className="text-white/40" /> Settings
        </h1>
        <p className="text-sm text-white/40 mt-0.5">Configure tax rates, cash accounts, and preferences</p>
      </div>

      {/* Tax Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="font-display font-bold text-sm text-white">Tax Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Income Tax Rate (%)</label>
            <input
              type="number" min="0" max="100" step="0.1" className="input"
              value={settings.tax_rate || ''}
              onChange={e => setSettings(s => ({ ...s, tax_rate: e.target.value }))}
            />
            <p className="text-xs text-white/30 mt-1">Applied to gross income for liability estimate</p>
          </div>
          <div>
            <label className="label">Tax Buffer % (keep aside)</label>
            <input
              type="number" min="0" max="100" step="1" className="input"
              value={settings.tax_buffer_percent || ''}
              onChange={e => setSettings(s => ({ ...s, tax_buffer_percent: e.target.value }))}
            />
            <p className="text-xs text-white/30 mt-1">% of income to reserve for tax payments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={saveSettings} className="btn-primary flex items-center gap-1.5">
            <Save size={13} /> {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Cash Accounts */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={15} className="text-accent-light" />
            <h3 className="font-display font-bold text-sm text-white">Cash Accounts</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white number-mono">{formatCurrency(totalCash)}</span>
            <button onClick={() => setAddCashOpen(true)} className="btn-primary py-1.5 text-xs flex items-center gap-1">
              <Plus size={12} /> Add Account
            </button>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {cashAccounts.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-white/30">No cash accounts added yet</p>
              <button onClick={() => setAddCashOpen(true)} className="btn-ghost mt-3 text-xs">Add your first account</button>
            </div>
          )}
          {cashAccounts.map(acc => (
            <div key={acc.id} className="px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-ladder/10 flex items-center justify-center">
                <Wallet size={14} className="text-green-ladder" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{acc.name}</p>
                {acc.notes && <p className="text-xs text-white/30">{acc.notes}</p>}
              </div>
              <p className="text-sm font-bold text-white number-mono">{formatCurrency(acc.balance, acc.currency)}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => openEditCash(acc)} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition-colors">
                  <SettingsIcon size={11} className="text-white/40" />
                </button>
                <button onClick={() => handleDeleteCash(acc.id)} className="w-7 h-7 rounded-lg bg-red-ladder/10 hover:bg-red-ladder/20 flex items-center justify-center transition-colors">
                  <Trash2 size={11} className="text-red-ladder" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Cash Modal */}
      {addCashOpen && (
        <Modal title="Add Cash Account" onClose={() => setAddCashOpen(false)} size="sm">
          <CashForm form={cashForm} setForm={setCashForm} onSubmit={handleAddCash} onCancel={() => setAddCashOpen(false)} />
        </Modal>
      )}

      {editCash && (
        <Modal title={`Edit · ${editCash.name}`} onClose={() => setEditCash(null)} size="sm">
          <CashForm form={cashForm} setForm={setCashForm} onSubmit={handleEditCash} onCancel={() => setEditCash(null)} isEdit />
        </Modal>
      )}
    </div>
  )
}

function CashForm({ form, setForm, onSubmit, onCancel, isEdit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label">Account Name</label>
        <input type="text" className="input" placeholder="Main Checking, Savings..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Balance</label>
        <input type="number" step="0.01" className="input" placeholder="0.00" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Currency</label>
        <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
      <div>
        <label className="label">Notes</label>
        <input type="text" className="input" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">{isEdit ? 'Save' : 'Add Account'}</button>
      </div>
    </form>
  )
}
