export type Card = {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  price: number
  image?: string
  collection: string
}

const RARITY_COLORS: Record<Card['rarity'], string> = {
  common: '#8888AA',
  rare: '#00E5FF',
  epic: '#8B5FFF',
  legendary: '#FFD700',
}

function CardItem({ card }: { card: Card }) {
  const rarityColor = RARITY_COLORS[card.rarity]

  return (
    <article
      className="relative flex flex-col rounded overflow-hidden cursor-pointer transition-transform duration-200 hover:-translate-y-1"
      style={{
        background: 'var(--color-pc-surface)',
        border: `1px solid ${rarityColor}40`,
        boxShadow: `0 0 0 0 ${rarityColor}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.boxShadow = `0 0 16px ${rarityColor}40`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.boxShadow = 'none'
      }}
    >
      <div
        className="aspect-square flex items-center justify-center text-5xl"
        style={{ background: `linear-gradient(135deg, ${rarityColor}15, var(--color-pc-dark))` }}
      >
        {card.image ? (
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', color: rarityColor, fontSize: '2rem' }}>
            {'#' + card.id.slice(-4)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold truncate">{card.name}</span>
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)', color: rarityColor }}
          >
            {card.rarity[0]}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--color-pc-muted)' }}>
          {card.collection}
        </span>
        <div className="flex items-center justify-between mt-2">
          <span
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-secondary)' }}
          >
            {card.price.toFixed(3)} ETH
          </span>
          <button
            className="px-3 py-1 text-xs font-bold rounded"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--color-pc-primary)',
              color: 'var(--color-pc-text)',
            }}
          >
            BUY
          </button>
        </div>
      </div>
    </article>
  )
}

export default function CardGrid({ cards }: { cards: Card[] }) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span
          className="text-4xl"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pc-border)' }}
        >
          [ EMPTY ]
        </span>
        <p style={{ color: 'var(--color-pc-muted)' }}>No cards match your filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map(card => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  )
}
