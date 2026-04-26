import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'HOME' },
  { to: '/marketplace', label: 'MARKET' },
  { to: '/profile', label: 'PROFILE' },
]

export default function NavBar() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-pc-border)' }}
    >
      <Link to="/" className="flex items-center gap-2">
        <span
          className="text-xl font-bold tracking-widest"
          style={{ color: 'var(--color-pc-primary)', fontFamily: 'var(--font-mono)' }}
        >
          PIXEL<span style={{ color: 'var(--color-pc-secondary)' }}>CARTEL</span>
        </span>
      </Link>

      <div className="flex items-center gap-8">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-sm font-semibold tracking-widest transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-mono)',
              color: pathname === to ? 'var(--color-pc-primary)' : 'var(--color-pc-muted)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <button
        className="px-4 py-2 text-sm font-bold tracking-wider rounded transition-all duration-200"
        style={{
          fontFamily: 'var(--font-mono)',
          background: 'var(--color-pc-primary)',
          color: 'var(--color-pc-text)',
          border: '1px solid var(--color-pc-primary-glow)',
        }}
      >
        CONNECT
      </button>
    </nav>
  )
}
