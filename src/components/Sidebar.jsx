import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Landmark, PieChart, Settings } from 'lucide-react'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview' },
  { to: '/tax',         icon: Landmark,        label: 'Tax Engine' },
  { to: '/loans',       icon: TrendingUp,      label: 'Loan Extinguisher' },
  { to: '/investments', icon: PieChart,        label: 'Portfolio' },
  { to: '/settings',   icon: Settings,        label: 'Settings' },
]

// Decorative ladder rungs — visual identity
function LadderIcon() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none" className="flex-shrink-0">
      <line x1="3" y1="2" x2="3" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="15" y1="2" x2="15" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="3" y1="6"  x2="15" y2="6"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col min-h-screen" style={{ background: '#0f1014', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Logo */}
      <div className="px-5 pt-7 pb-6 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-accent-light opacity-80">
            <LadderIcon />
          </span>
          <span className="font-display font-extrabold text-xl tracking-tight gradient-text">
            theladder
          </span>
        </div>
        <p className="text-xs text-white/25 font-medium pl-0.5">your financial OS</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-accent/15 text-accent-light'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? 'text-accent-light' : 'text-white/35 group-hover:text-white/60'} />
                <span className="flex-1 text-[13px]">{label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent-light/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/40 to-green-ladder/30 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            G
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/70">Private mode</p>
            <p className="text-xs text-white/25">browser · local only</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
