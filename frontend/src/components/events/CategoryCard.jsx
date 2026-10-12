/**
 * Visual Category Card matching reference design:
 * Bold category name on the left, high-quality picture on the right inside a soft pastel pill card.
 */
export default function CategoryCard({ category, isSelected = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center justify-between pl-4 pr-1.5 py-1.5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden text-left h-16 sm:h-20
        ${
          isSelected
            ? `${category.activeBg} ring-2 ring-[#8c7fb4] shadow-sm scale-[1.02]`
            : `${category.bgClass} hover:shadow-md hover:-translate-y-0.5`
        }
      `}
    >
      {/* Category Name on Left */}
      <div className="min-w-0 pr-2">
        <span
          className={`block text-xs sm:text-sm font-bold tracking-tight leading-tight truncate ${category.textColor}`}
        >
          {category.name}
        </span>
        {isSelected && (
          <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#8c7fb4] uppercase tracking-wider">
            Selected
          </span>
        )}
      </div>

      {/* Picture on Right */}
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-white/40 shadow-xs">
        <img
          src={category.image}
          alt={category.alt || category.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </div>
    </button>
  )
}
