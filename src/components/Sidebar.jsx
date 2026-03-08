import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/tax-planner', label: 'Tax Planner', icon: '📋' },
    { to: '/loan-extinguisher', label: 'Loan Extinguisher', icon: '🏦' },
    { to: '/investments', label: 'Investments', icon: '📈' },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-brand">
                <span className="brand-text">ascend</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ to, label, icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                        end={to === '/'}
                    >
                        <span className="nav-icon">{icon}</span>
                        <span className="nav-label">{label}</span>
                        {location.pathname === to && <span className="active-indicator" />}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-footer-text">
                    <span className="version">v1.0.0</span>
                </div>
            </div>
        </aside>
    );
}
