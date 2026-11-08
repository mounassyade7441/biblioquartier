import { Link } from 'react-router'
import { formatDate } from '../../utils/format'

/** Historique des anciens emprunts (tableau sur ordinateur, liste sur téléphone). */
export default function HistoryList({ loans }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="hidden bg-stone-50 text-xs uppercase tracking-wider text-stone-500 sm:table-header-group">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">Livre</th>
            <th scope="col" className="px-5 py-3 font-semibold">Emprunté le</th>
            <th scope="col" className="px-5 py-3 font-semibold">Rendu le</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {loans.map((loan) => {
            // Comparaison de deux dates venues de l'API (pas de "maintenant") : calcul stable
            const late = new Date(loan.returned_at) > new Date(loan.due_at)
            return (
              <tr key={loan.id} className="block px-5 py-3 sm:table-row sm:p-0">
                <td className="block sm:table-cell sm:px-5 sm:py-3.5">
                  <Link to={`/livres/${loan.book.id}`} className="font-medium text-ink hover:text-brand-700">
                    {loan.book.title}
                  </Link>
                  <span className="block text-xs text-stone-500">{loan.book.author}</span>
                </td>
                <td className="inline sm:table-cell sm:px-5 sm:py-3.5">
                  <span className="text-stone-500 sm:hidden">Du </span>
                  {formatDate(loan.borrowed_at)}
                </td>
                <td className="inline sm:table-cell sm:px-5 sm:py-3.5">
                  <span className="text-stone-500 sm:hidden"> au </span>
                  {formatDate(loan.returned_at)}
                  {late && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">rendu en retard</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
