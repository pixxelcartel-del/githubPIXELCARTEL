import { useState, useMemo } from 'react'
import CardGrid from '../components/CardGrid'
import type { Card } from '../components/CardGrid'

const ALL_CARDS: Card[] = [
  { id: 'm001', name: 'Shadow Reaper', rarity: 'legendary', price: 2.45, collection: 'Dark Order' },
  { id: 'm002', name: 'Hex Knight', rarity: 'legendary', price: 3.10, collection: 'Iron Veil' },
  { id: 'm003', name: 'Null Empress', rarity: 'legendary', price: 4.22, collection: 'Cipher Pack' },
  { id: 'm004', name: 'Neon Samurai', rarity: 'epic', price: 0.87, collection: 'Cyber Ronin' },
  { id: 'm005', name: 'Void Witch', rarity: 'epic', price: 0.72, collection: 'Dark Order' },
  { id: 'm006', name: 'Apex Crypt', rarity: 'epic', price: 0.61, collection: 'Iron Veil' },
  { id: 'm007', name: 'Phantom Blade', rarity: 'epic', price: 0.55, collection: 'Cyber Ronin' },
  { id: 'm008', name: 'Grid Runner', rarity: 'rare', price: 0.21, collection: 'Cyber Ronin' },
  { id: 'm009', name: 'Data Phantom', rarity: 'rare', price: 0.18, collection: 'Matrix Set' },
  { id: 'm010', name: 'Signal Ghost', rarity: 'rare', price: 0.33, collection: 'Cipher Pack' },
  { id: 'm011', name: 'Byte Wolf', rarity: 'rare', price: 0.14, collection: 'Matrix Set' },
  { id: 'm012', name: 'Rogue Scout', rarity: 'rare', price: 0.27, collection: 'Dark Order' },
  { id: 'm013', name: 'Pixel Drone', rarity: 'common', price: 0.04, collection: 'Matrix Set' },
  { id: 'm014', name: 'Rogue Bit', rarity: 'common', price: 0.02, collection: 'Matrix Set' },
  { id: 'm015', name: 'Field Node', rarity: 'common', price: 0.03, collection: 'Cyber Ronin' },
  { id: 'm016', name: 'Static Pawn', rarity: 'common', price: 0.01, collection: 'Iron Veil' },
  { id: 'm017', name: 'Cipher Grunt', rarity: 'common', price: 0.05, collection: 'Cipher Pack' },
  { id: 'm018', name: 'Arc Warden', rarity: 'epic', price: 0.68, collection: 'Iron Veil' },
  { id: 'm019', name: 'Null Soldier', rarity: 'rare', price: 0.19, collection: 'Cipher Pack' },
  { id: 'm020', name: 'Binary Specter', rarity: 'legendary', price: 1.88, collection: 'Dark Order' },
]

type Rarity = Card['rarity'] | 'all'
type SortKey = 'price-asc' | 'price-desc' | 'rarity'

const RARITIES: { value: Rarity; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'legendary', label: 'LEGENDARY' },
  { value: 'epic', label: 'EPIC' },
  { value: 'rare', label: 'RARE' },
  { value: 'common', label: 'COMMON' },
]

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'price-asc', label: 'PRICE ↑' },
  { value: 'price-desc', label: 'PRICE ↓' },
  { value: 'rarity', label: 'RARITY' },
]

const RARITY_RANK: Record<Card['rarity'], number> = {
  legendary: 0, epic: 1, rare: 2, common: 3,
}

const COLLECTIONS = ['All', ...Array.from(new Set(ALL_CARDS.map(c => c.collection)))]

export default function Marketplace() {
  const [rarity, setRarity] = useState<Rarity>('all')
  const [sort, setSort] = useState<SortKey>('rarity')
  const [collection, setCollection] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let cards = ALL_CARDS

    if (rarity !== 'all') cards = cards.filter(c => c.rarity === rarity)
    if (collection !== 'All') cards = cards.filter(c => c.collection === collection)
    if (search.trim()) {
      const q = search.toLowerCase()
      cards = cards.filter(c => c.name.toLowerCase().includes(q) || c.collection.toLowerCase().includes(q))
    }

    return [...cards].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      return RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity]
    })
  }, [rarity, sort, collection, search])

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <div className="mb-10">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span style={{ color: 'var(--color-pc-primary)' }}>// </span>
          MARKETPLACE
        </h1>
        <p style={{ color: 'var(--color-pc-muted)', fontSize: '0.875rem' }}>
          {filtered.length} cards available
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <input
          type="text"
          placeholder="SEARCH CARDS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 rounded text-sm outline-none"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--color-pc-surface)',
            border: '1px solid var(--color-pc-border)',
            color: 'var(--color-pc-text)',
          }}
        />

        <div className="flex flex-wrap gap-2">
          {RARITIES.map(r => (
            <button
              key={r.value}
              onClick={() => setRarity(r.value)}
              className="px-3 py-1 text-xs font-bold rounded transition-all duration-150"
              style={{
                fontFamily: 'var(--font-mono)',
                background: rarity === r.value ? 'var(--color-pc-primary)' : 'var(--color-pc-surface)',
                color: rarity === r.value ? 'var(--color-pc-text)' : 'var(--color-pc-muted)',
                border: `1px solid ${rarity === r.value ? 'var(--color-pc-primary)' : 'var(--color-pc-border)'}`,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            {SORTS.map(s => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className="px-3 py-1 text-xs font-bold rounded transition-all duration-150"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: sort === s.value ? 'var(--color-pc-dark)' : 'transparent',
                  color: sort === s.value ? 'var(--color-pc-secondary)' : 'var(--color-pc-muted)',
                  border: `1px solid ${sort === s.value ? 'var(--color-pc-secondary)40' : 'var(--color-pc-border)'}`,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <select
            value={collection}
            onChange={e => setCollection(e.target.value)}
            className="px-3 py-1 text-xs font-bold rounded outline-none"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--color-pc-surface)',
              border: '1px solid var(--color-pc-border)',
              color: 'var(--color-pc-muted)',
            }}
          >
            {COLLECTIONS.map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <CardGrid cards={filtered} />
    </main>
  )
}
