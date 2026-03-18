export default function StatCard({ label, value, sub, trend, icon: Icon, color = 'accent', className = '' }) {
  const colors = {
    accent: 'text-accent-light',
    green: 'text-green-ladder',
    amber: 'text-amber-ladder',
    red: 'text-red-ladder',
    white: 'text-white',
  }

  return (
    <div className={`card p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center`}>
            <Icon size={15} className={colors[color] || 'text-white/40'} />
          </div>
        )}
      </div>
      <div>
        <div className={`text-2xl font-display font-bold number-mono ${colors[color] || 'text-white'}`}>
          {value}
        </div>
        {(sub || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {sub && <span className="text-xs text-white/40">{sub}</span>}
            {trend !== undefined && (
              <span className={`text-xs font-semibold ${trend >= 0 ? 'text-green-ladder' : 'text-red-ladder'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
