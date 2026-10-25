export default function QtySelector({ value, onChange }) {
  return (
    <span className="qty" role="group" aria-label="Quantity">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </span>
  )
}
