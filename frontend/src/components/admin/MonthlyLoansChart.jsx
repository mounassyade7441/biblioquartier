import { useState } from 'react'

/**
 * Histogramme "emprunts par mois" (6 derniers mois), en HTML/CSS pur.
 *
 * Choix de lisibilité :
 * - une seule série → pas de légende, le titre dit ce qui est affiché
 * - barres fines, coins arrondis seulement en haut, quadrillage discret
 * - seule la valeur du mois en cours est écrite ; les autres apparaissent au survol / au focus clavier
 * - un tableau équivalent (masqué visuellement) pour les lecteurs d'écran
 */
const BAR_COLOR = '#1a8a5c' // vert validé (luminosité, saturation, contraste) pour un graphique

function niceMax(value) {
  if (value <= 5) return 5
  const step = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / step) * step
}

export default function MonthlyLoansChart({ months }) {
  const [active, setActive] = useState(null)
  const max = niceMax(Math.max(...months.map((m) => m.count), 1))
  const ticks = [0, max / 2, max]
  const last = months.length - 1

  return (
    <figure>
      <figcaption className="mb-4">
        <span className="font-serif text-lg font-semibold">Emprunts par mois</span>
        <span className="block text-xs text-stone-500">6 derniers mois</span>
      </figcaption>

      <div className="relative h-48 pl-8" aria-hidden="true">
        {/* Quadrillage + graduations */}
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 left-8 border-t border-stone-200" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="absolute -left-8 -translate-y-1/2 text-[11px] tabular-nums text-stone-400">{t}</span>
          </div>
        ))}

        {/* Barres */}
        <div className="absolute inset-0 left-8 flex items-end justify-around">
          {months.map((m, i) => {
            const height = (m.count / max) * 100
            const showValue = i === last || active === i
            return (
              <div
                key={m.month}
                className="relative flex h-full w-full max-w-16 cursor-default items-end justify-center"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                {showValue && (
                  <span
                    className="absolute -translate-y-1 rounded bg-ink px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white"
                    style={{ bottom: `${height}%` }}
                  >
                    {m.count}
                  </span>
                )}
                <div
                  className="w-6 rounded-t transition-opacity"
                  style={{ height: `${Math.max(height, m.count > 0 ? 2 : 0)}%`, background: BAR_COLOR, opacity: active === null || active === i ? 1 : 0.55 }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Mois */}
      <div className="flex justify-around pl-8 pt-2" aria-hidden="true">
        {months.map((m) => (
          <span key={m.month} className="w-full max-w-16 text-center text-[11px] text-stone-500">
            {m.label.replace(/ \d{4}$/, '')}
          </span>
        ))}
      </div>

      {/* Version accessible (lecteurs d'écran) */}
      <table className="sr-only">
        <caption>Nombre d'emprunts par mois</caption>
        <thead>
          <tr>
            <th scope="col">Mois</th>
            <th scope="col">Emprunts</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <td>{m.label}</td>
              <td>{m.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
