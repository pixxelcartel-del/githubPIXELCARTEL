import HeroSection from '../components/HeroSection'
import CardGrid from '../components/CardGrid'
import type { Card } from '../components/CardGrid'

const FEATURED_CARDS: Card[] = [
  { id: 'f001a', name: 'Shadow Reaper', rarity: 'legendary', price: 2.45, collection: 'Dark Order' },
  { id: 'f002b', name: 'Neon Samurai', rarity: 'epic', price: 0.87, collection: 'Cyber Ronin' },
  { id: 'f003c', name: 'Void Witch', rarity: 'epic', price: 0.72, collection: 'Dark Order' },
  { id: 'f004d', name: 'Grid Runner', rarity: 'rare', price: 0.21, collection: 'Cyber Ronin' },
  { id: 'f005e', name: 'Data Phantom', rarity: 'rare', price: 0.18, collection: 'Matrix Set' },
  { id: 'f006f', name: 'Pixel Drone', rarity: 'common', price: 0.04, collection: 'Matrix Set' },
  { id: 'f007g', name: 'Hex Knight', rarity: 'legendary', price: 3.10, collection: 'Iron Veil' },
  { id: 'f008h', name: 'Signal Ghost', rarity: 'rare', price: 0.33, collection: 'Cipher Pack' },
  { id: 'f009i', name: 'Rogue Bit', rarity: 'common', price: 0.02, collection: 'Matrix Set' },
  { id: 'f010j', name: 'Apex Crypt', rarity: 'epic', price: 0.61, collection: 'Iron Veil' },
]

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-2xl font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-secondary)' }}
      >
        {value}
      </span>
      <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-pc-muted)' }}>
        {label}
      </span>
    </div>
  )
}

export default function Home() {
  return (
    <main>
      <HeroSection />

      {/* Stats bar */}
      <section
        className="py-8 px-6"
        style={{ borderTop: '1px solid var(--color-pc-border)', borderBottom: '1px solid var(--color-pc-border)', background: 'var(--color-pc-dark)' }}
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-around gap-8">
          <StatBadge value="12,847" label="Cards Listed" />
          <StatBadge value="3,291" label="Traders" />
          <StatBadge value="847.3 ETH" label="Volume" />
          <StatBadge value="4" label="Collections" />
        </div>
      </section>

      {/* Featured drops */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span style={{ color: 'var(--color-pc-primary)' }}>// </span>
            FEATURED DROPS
          </h2>
          <a
            href="/marketplace"
            className="text-xs font-bold tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-muted)' }}
          >
            VIEW ALL →
          </a>
        </div>
        <CardGrid cards={FEATURED_CARDS} />
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center"
        style={{ borderTop: '1px solid var(--color-pc-border)' }}
      >
        <p
          className="text-xs tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-muted)' }}
        >
          PIXELCARTEL · ON-CHAIN PIXEL ART · ALL RIGHTS RESERVED
        </p>
      </footer>
    </main>
  )
}
