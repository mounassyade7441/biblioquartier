import { useState } from 'react'

/**
 * Couverture d'un livre.
 * - Si le livre a une image (cover_url) : on l'affiche.
 * - Sinon (ou si l'image ne charge pas) : on dessine une couverture "reliée"
 *   avec le titre et l'auteur. La couleur dépend du titre : un même livre
 *   a donc toujours la même couleur.
 */
const PALETTES = [
  ['#1d5543', '#2f8264'], // vert
  ['#7c2d12', '#b4532a'], // terre cuite
  ['#1e3a5f', '#3b6ea5'], // bleu
  ['#4a1d5c', '#7e3f98'], // prune
  ['#5b4636', '#8a6f55'], // cuir
  ['#7a1f2b', '#b23a48'], // bordeaux
  ['#24423a', '#4c7a6b'], // sauge
  ['#3f3d56', '#6c6a8a'], // ardoise
]

function paletteFor(text = '') {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PALETTES[hash % PALETTES.length]
}

export default function BookCover({ book, size = 'md', className = '' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [dark, light] = paletteFor(book.title)
  const big = size === 'lg'

  const frame = `relative aspect-[2/3] w-full overflow-hidden rounded-r-md rounded-l-sm shadow-md shadow-stone-900/15 ${className}`

  if (book.cover_url && !imageFailed) {
    return (
      <div className={`${frame} bg-stone-200`}>
        <img
          src={book.cover_url}
          alt={`Couverture de « ${book.title} »`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="size-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={frame}
      style={{ background: `linear-gradient(135deg, ${light} 0%, ${dark} 100%)` }}
      role="img"
      aria-label={`Couverture de « ${book.title} »`}
    >
      {/* Dos du livre (bande sombre à gauche) */}
      <div className="absolute inset-y-0 left-0 w-[7%] bg-black/25" />
      {/* Filet doré */}
      <div className="absolute inset-[9%] left-[14%] rounded-sm border border-white/25" />

      <div className={`absolute inset-0 flex flex-col justify-between pl-[18%] pr-[10%] ${big ? 'py-[16%]' : 'py-[14%]'}`}>
        <p
          className={`font-serif font-semibold leading-tight text-white text-balance ${big ? 'text-2xl' : 'text-[0.95rem] sm:text-base'}`}
          style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {book.title}
        </p>
        <p className={`font-medium uppercase tracking-wider text-white/75 ${big ? 'text-xs' : 'text-[0.6rem]'}`}>
          {book.author}
        </p>
      </div>
    </div>
  )
}
