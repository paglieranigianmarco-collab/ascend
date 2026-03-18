import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Landmark, PieChart, Settings, ChevronRight
} from 'lucide-react'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview' },
  { to: '/tax',         icon: Landmark,        label: 'Tax Engine' },
  { to: '/loans',       icon: TrendingUp,      label: 'Loans' },
  { to: '/investments', icon: PieChart,        label: 'Portfolio' },
  { to: '/settings',    icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-1 border-r border-white/[0.05] min-h-screen">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.05]">
        <span className="font-display font-extrabold text-xl tracking-tight gradient-text">
          theladder
        </span>
        <p className="text-xs text-white/30 mt-0.5 font-medium">your financial OS</p>
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
                  : 'text-white/50 hover:text-white/90 hover:bg-white/[0.05]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-accent-light' : 'text-white/40 group-hover:text-white/70'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-accent/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xs font-bold">
            G
          </div>
          <div>
            <p className="text-xs font-semibold text-white/80">Local mode</p>
            <p className="text-xs text-white/30">SQLite · Private</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
