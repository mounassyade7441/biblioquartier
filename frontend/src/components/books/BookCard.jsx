import { Link } from 'react-router'
import AvailabilityBadge from './AvailabilityBadge'
import BookCover from './BookCover'

/** Carte d'un livre dans la grille du catalogue. Toute la carte est cliquable. */
export default function BookCard({ book }) {
  return (
    <article className="group relative flex flex-col">
      <BookCover book={book} className="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg" />

      <div className="mt-3 flex flex-1 flex-col">
        {book.category && (
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-brand-700">{book.category.name}</p>
        )}
        <h3 className="mt-0.5 font-serif text-base font-semibold leading-snug text-ink">
          {/* Le lien couvre toute la carte grâce à ::after (astuce "carte cliquable" accessible) */}
          <Link to={`/livres/${book.id}`} className="after:absolute after:inset-0 hover:text-brand-700">
            {book.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-stone-600">{book.author}</p>
        <div className="mt-auto pt-2.5">
          <AvailabilityBadge book={book} />
        </div>
      </div>
    </article>
  )
}
