// Pure localStorage store — no backend needed.
// Same interface as the original server API so all pages work unchanged.

const K = {
  income:        'tl_income',
  taxes:         'tl_taxes',
  loans:         'tl_loans',
  loan_payments: 'tl_loan_payments',
  investments:   'tl_investments',
  cash:          'tl_cash',
  settings:      'tl_settings',
  seq:           'tl_seq',
}

function load(key)          { return JSON.parse(localStorage.getItem(key) || '[]') }
function loadObj(key, def)  { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)) }
function save(key, val)     { localStorage.setItem(key, JSON.stringify(val)) }
function p(v)               { return Promise.resolve(v) }
function round(n)           { return Math.round(n * 100) / 100 }
function ts()               { return new Date().toISOString() }

function nextId(entity) {
  const seq = loadObj(K.seq, {})
  seq[entity] = (seq[entity] || 0) + 1
  save(K.seq, seq)
  return seq[entity]
}

// ─── Seed defaults on first load ─────────────────────────────────────────────
;(function seed() {
  if (load(K.taxes).length === 0) {
    save(K.taxes, [
      { id:1, period:'Q1_2025',    period_label:'1st Advance (Q1)',      due_date:'2025-06-30', estimated_amount:0, billed_amount:0, paid_amount:0, status:'estimated', notes:'' },
      { id:2, period:'Q2_2025',    period_label:'2nd Advance (Q2)',      due_date:'2025-11-30', estimated_amount:0, billed_amount:0, paid_amount:0, status:'estimated', notes:'' },
      { id:3, period:'Q3_2026',    period_label:'1st Advance (Q1)',      due_date:'2026-06-30', estimated_amount:0, billed_amount:0, paid_amount:0, status:'estimated', notes:'' },
      { id:4, period:'Q4_2026',    period_label:'2nd Advance (Q2)',      due_date:'2026-11-30', estimated_amount:0, billed_amount:0, paid_amount:0, status:'estimated', notes:'' },
      { id:5, period:'ANNUAL_2025',period_label:'Annual Settlement 2025',due_date:'2026-06-30', estimated_amount:0, billed_amount:0, paid_amount:0, status:'estimated', notes:'' },
    ])
    const seq = loadObj(K.seq, {}); seq.taxes = 5; save(K.seq, seq)
  }
  if (!localStorage.getItem(K.settings)) {
    save(K.settings, { tax_rate:'23', currency:'EUR', tax_buffer_percent:'30' })
  }
})()

// ─── Loan amortisation (ported from server) ───────────────────────────────────
function calcProjection(loan, extraPayment) {
  const monthlyRate = loan.interest_rate / 100 / 12

  function schedule(balance, base, extra) {
    const rows = []
    let bal = balance, month = 0
    while (bal > 0.01 && month < 600) {
      const interest  = monthlyRate > 0 ? bal * monthlyRate : 0
      const payment   = base + extra
      if (payment <= interest) break // infinite loop guard
      const principal = Math.min(bal, payment - interest)
      bal = Math.max(0, bal - principal)
      month++
      rows.push({ month, balance: round(bal), interest: round(interest), principal: round(principal) })
    }
    return rows
  }

  const base   = schedule(loan.current_balance, loan.monthly_payment, 0)
  const attack = schedule(loan.current_balance, loan.monthly_payment, extraPayment)
  const ref    = new Date()

  function addMonths(n) {
    const d = new Date(ref); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7)
  }

  const baseInt   = base.reduce((s, r) => s + r.interest, 0)
  const attackInt = attack.reduce((s, r) => s + r.interest, 0)

  return {
    loan_id: loan.id, loan_name: loan.name,
    current_balance: loan.current_balance, monthly_payment: loan.monthly_payment,
    interest_rate: loan.interest_rate, extra_payment: extraPayment,
    base:   { months: base.length,   payoff_date: addMonths(base.length),   total_interest: round(baseInt),   schedule: base.slice(0, 120) },
    attack: { months: attack.length, payoff_date: addMonths(attack.length), total_interest: round(attackInt), schedule: attack.slice(0, 120) },
    months_saved:    Math.max(0, base.length - attack.length),
    interest_saved:  round(baseInt - attackInt),
  }
}

// ─── Dashboard computations ───────────────────────────────────────────────────
function computeNetWorth() {
  const cash  = load(K.cash).reduce((s, a) => s + a.balance, 0)
  const invs  = load(K.investments).reduce((s, i) => s + i.quantity * i.current_price, 0)
  const loans = load(K.loans).reduce((s, l) => s + l.current_balance, 0)
  const taxLiability = load(K.taxes)
    .filter(t => t.status !== 'paid')
    .reduce((s, t) => s + Math.max(0, t.estimated_amount - t.paid_amount), 0)
  const assets      = round(cash + invs)
  const liabilities = round(loans + taxLiability)
  return {
    assets:      { cash: round(cash), investments: round(invs), total: assets },
    liabilities: { loans: round(loans), tax_accrued: round(taxLiability), total: liabilities },
    net_worth:   round(assets - liabilities),
  }
}

function computeDeadlines() {
  const today = new Date().toISOString().slice(0, 10)
  const taxes = load(K.taxes)
    .filter(t => t.status !== 'paid' && t.due_date >= today)
    .map(t => ({ type:'tax', label: t.period_label, due_date: t.due_date, status: t.status, amount: t.estimated_amount }))
    .slice(0, 6)
  const loanDeadlines = load(K.loans).map(loan => {
    const d = new Date()
    if (d.getDate() > 1) d.setMonth(d.getMonth() + 1)
    d.setDate(1)
    return { type:'loan', label:`${loan.name} Payment`, due_date: d.toISOString().slice(0, 10), status:'pending', amount: loan.monthly_payment }
  })
  return [...taxes, ...loanDeadlines].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 8)
}

function computeCashflow(year) {
  const income = load(K.income)
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return months.map((m, i) => {
    const inc = income.filter(r => r.date?.startsWith(`${year}-${m}`)).reduce((s, r) => s + r.amount, 0)
    return { month: labels[i], income: inc, expenses: 0, net: inc }
  })
}

function computeTaxBuffer(year) {
  const incomeTotal = load(K.income)
    .filter(r => r.date?.startsWith(String(year)))
    .reduce((s, r) => s + r.amount, 0)
  const settings  = loadObj(K.settings, { tax_rate:'23', tax_buffer_percent:'30' })
  const taxRate   = parseFloat(settings.tax_rate || 23)
  const bufferPct = parseFloat(settings.tax_buffer_percent || 30)
  const paidTotal = load(K.taxes).reduce((s, t) => s + t.paid_amount, 0)
  const estimated = round(incomeTotal * taxRate / 100)
  return {
    gross_income: round(incomeTotal), tax_rate: taxRate, buffer_percent: bufferPct,
    estimated_tax: estimated,
    buffer_needed: round(incomeTotal * bufferPct / 100),
    already_paid:  round(paidTotal),
    remaining_liability: round(Math.max(0, estimated - paidTotal)),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const api = {
  // Dashboard
  netWorth:       ()         => p(computeNetWorth()),
  deadlines:      ()         => p(computeDeadlines()),
  cashflow:       (year)     => p(computeCashflow(year)),
  getCash:        ()         => p(load(K.cash)),
  addCash:        (data)     => { const item = { ...data, id: nextId('cash'), updated_at: ts() };   save(K.cash, [...load(K.cash), item]); return p({ id: item.id }) },
  updateCash:     (id, data) => { save(K.cash, load(K.cash).map(x => x.id == id ? { ...x, ...data, updated_at: ts() } : x)); return p({ ok:true }) },
  deleteCash:     (id)       => { save(K.cash, load(K.cash).filter(x => x.id != id)); return p({ ok:true }) },
  getSettings:    ()         => p(loadObj(K.settings, { tax_rate:'23', currency:'EUR', tax_buffer_percent:'30' })),
  updateSettings: (data)     => { save(K.settings, { ...loadObj(K.settings, {}), ...data }); return p({ ok:true }) },

  // Income
  getIncome: (params = {}) => {
    let rows = load(K.income)
    if (params.year && params.month) rows = rows.filter(r => r.date?.startsWith(`${params.year}-${String(params.month).padStart(2,'0')}`))
    else if (params.year)            rows = rows.filter(r => r.date?.startsWith(String(params.year)))
    return p(rows.sort((a, b) => b.date?.localeCompare(a.date)))
  },
  addIncome:    (data)     => { const item = { ...data, id: nextId('income'), created_at: ts() }; save(K.income, [...load(K.income), item]); return p({ id: item.id }) },
  updateIncome: (id, data) => { save(K.income, load(K.income).map(x => x.id == id ? { ...x, ...data } : x)); return p({ ok:true }) },
  deleteIncome: (id)       => { save(K.income, load(K.income).filter(x => x.id != id)); return p({ ok:true }) },
  incomeSummary:(year)     => {
    const rows    = load(K.income).filter(r => r.date?.startsWith(String(year)))
    const byMonth = {}
    for (const r of rows) { const m = r.date?.slice(0,7); byMonth[m] = (byMonth[m]||0) + r.amount }
    return p({ monthly: Object.entries(byMonth).map(([month, total]) => ({ month, total })), yearly_total: round(rows.reduce((s,r)=>s+r.amount,0)) })
  },

  // Taxes
  getTaxes:  ()        => p([...load(K.taxes)].sort((a,b) => a.due_date?.localeCompare(b.due_date))),
  updateTax: (id,data) => { save(K.taxes, load(K.taxes).map(x => x.id == id ? { ...x, ...data } : x)); return p({ ok:true }) },
  taxBuffer: (year)    => p(computeTaxBuffer(year)),

  // Loans
  getLoans:       ()         => p(load(K.loans)),
  addLoan:        (data)     => { const item = { ...data, id: nextId('loans'), created_at: ts() }; save(K.loans, [...load(K.loans), item]); return p({ id: item.id }) },
  updateLoan:     (id, data) => { save(K.loans, load(K.loans).map(x => x.id == id ? { ...x, ...data } : x)); return p({ ok:true }) },
  deleteLoan:     (id)       => { save(K.loans, load(K.loans).filter(x => x.id != id)); save(K.loan_payments, load(K.loan_payments).filter(x => x.loan_id != id)); return p({ ok:true }) },
  loanProjection: (id, extra)  => {
    const loan = load(K.loans).find(l => l.id == id)
    if (!loan) return Promise.reject(new Error('Loan not found'))
    return p(calcProjection(loan, parseFloat(extra) || 0))
  },
  logPayment: (id, data) => {
    const pmt   = { ...data, id: nextId('loan_payments'), loan_id: id, created_at: ts() }
    save(K.loan_payments, [...load(K.loan_payments), pmt])
    const total = (parseFloat(data.amount) || 0) + (parseFloat(data.extra_amount) || 0)
    save(K.loans, load(K.loans).map(l => l.id == id ? { ...l, current_balance: Math.max(0, round(l.current_balance - total)) } : l))
    return p({ ok:true })
  },
  getPayments: (id) => p(load(K.loan_payments).filter(x => x.loan_id == id).sort((a,b) => b.date?.localeCompare(a.date))),

  // Investments
  getInvestments:   ()         => p(load(K.investments).sort((a,b) => (a.type+a.symbol).localeCompare(b.type+b.symbol))),
  addInvestment:    (data)     => { const item = { ...data, id: nextId('investments'), created_at: ts(), updated_at: ts() }; save(K.investments, [...load(K.investments), item]); return p({ id: item.id }) },
  updateInvestment: (id, data) => { save(K.investments, load(K.investments).map(x => x.id == id ? { ...x, ...data, updated_at: ts() } : x)); return p({ ok:true }) },
  deleteInvestment: (id)       => { save(K.investments, load(K.investments).filter(x => x.id != id)); return p({ ok:true }) },
  investmentSummary:()         => {
    const all        = load(K.investments)
    const totalValue = all.reduce((s,i) => s + i.quantity * i.current_price,  0)
    const totalCost  = all.reduce((s,i) => s + i.quantity * i.avg_buy_price,  0)
    const pnl        = totalValue - totalCost
    return p({ total_value: round(totalValue), total_cost: round(totalCost), total_pnl: round(pnl), total_pnl_pct: totalCost > 0 ? round(pnl/totalCost*100) : 0 })
  },
}
