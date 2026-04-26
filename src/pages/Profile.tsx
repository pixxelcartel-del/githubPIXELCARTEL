import { useParams } from 'react-router-dom'
import CardGrid from '../components/CardGrid'
import type { Card } from '../components/CardGrid'

const OWNED_CARDS: Card[] = [
  { id: 'p001', name: 'Shadow Reaper', rarity: 'legendary', price: 2.45, collection: 'Dark Order' },
  { id: 'p002', name: 'Neon Samurai', rarity: 'epic', price: 0.87, collection: 'Cyber Ronin' },
  { id: 'p003', name: 'Grid Runner', rarity: 'rare', price: 0.21, collection: 'Cyber Ronin' },
  { id: 'p004', name: 'Pixel Drone', rarity: 'common', price: 0.04, collection: 'Matrix Set' },
  { id: 'p005', name: 'Signal Ghost', rarity: 'rare', price: 0.33, collection: 'Cipher Pack' },
]

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded"
      style={{ background: 'var(--color-pc-surface)', border: '1px solid var(--color-pc-border)' }}
    >
      <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-pc-muted)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </span>
      <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-secondary)' }}>
        {value}
      </span>
    </div>
  )
}

export default function Profile() {
  const { address } = useParams()
  const displayAddress = address ?? '0x0000...0000'
  const shortAddress = displayAddress.length > 12
    ? displayAddress.slice(0, 6) + '...' + displayAddress.slice(-4)
    : displayAddress

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Profile header */}
      <div
        className="rounded-lg p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
        style={{ background: 'var(--color-pc-dark)', border: '1px solid var(--color-pc-border)' }}
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--color-pc-primary), var(--color-pc-accent))',
            fontFamily: 'var(--font-mono)',
            fontSize: '2rem',
            color: 'var(--color-pc-text)',
          }}
        >
          {shortAddress.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <span
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-text)' }}
          >
            {shortAddress}
          </span>
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-muted)' }}
          >
            {displayAddress}
          </span>
          <div className="flex gap-2 mt-1">
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'rgba(110,58,255,0.15)',
                color: 'var(--color-pc-primary)',
                border: '1px solid rgba(110,58,255,0.3)',
              }}
            >
              TRADER
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255,215,0,0.1)',
                color: 'var(--color-pc-secondary)',
                border: '1px solid rgba(255,215,0,0.2)',
              }}
            >
              LEVEL 7
            </span>
          </div>
        </div>

        <button
          className="px-4 py-2 text-xs font-bold rounded"
          style={{
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--color-pc-border)',
            color: 'var(--color-pc-muted)',
          }}
        >
          SHARE PROFILE
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <StatBox label="Cards Owned" value={String(OWNED_CARDS.length)} />
        <StatBox label="Total Value" value="3.90 ETH" />
        <StatBox label="Trades" value="24" />
        <StatBox label="Rank" value="#312" />
      </div>

      {/* Collection */}
      <div className="mb-8">
        <h2
          className="text-xl font-bold mb-6"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span style={{ color: 'var(--color-pc-primary)' }}>// </span>
          MY COLLECTION
        </h2>
        <CardGrid cards={OWNED_CARDS} />
      </div>
    </main>
  )
}
