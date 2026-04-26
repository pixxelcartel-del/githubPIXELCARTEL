import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section
      className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(110,58,255,0.15) 0%, transparent 70%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(110,58,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(110,58,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <p
        className="mb-4 text-xs font-bold tracking-[0.4em] uppercase"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-primary)' }}
      >
        PIXEL-ART · NFT · TRADING
      </p>

      <h1
        ref={titleRef}
        className="text-5xl sm:text-7xl font-bold leading-none mb-6"
        style={{ letterSpacing: '-0.02em' }}
      >
        The Underground
        <br />
        <span style={{ color: 'var(--color-pc-primary)' }}>Card</span>{' '}
        <span style={{ color: 'var(--color-pc-secondary)' }}>Cartel</span>
      </h1>

      <p
        className="max-w-xl text-lg mb-10"
        style={{ color: 'var(--color-pc-muted)' }}
      >
        Collect, trade, and battle with rare pixel-art cards. Every card is an on-chain asset. Every trade is a power move.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/marketplace"
          className="px-8 py-3 text-sm font-bold tracking-wider rounded transition-all duration-200"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--color-pc-primary)',
            color: 'var(--color-pc-text)',
            boxShadow: '0 0 24px rgba(110,58,255,0.4)',
          }}
        >
          EXPLORE MARKET
        </Link>
        <button
          className="px-8 py-3 text-sm font-bold tracking-wider rounded transition-all duration-200"
          style={{
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--color-pc-border)',
            color: 'var(--color-pc-text)',
          }}
        >
          HOW IT WORKS
        </button>
      </div>
    </section>
  )
}
