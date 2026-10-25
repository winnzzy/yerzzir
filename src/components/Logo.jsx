import { site } from '../config/site.js'

/* Yerzzir Store logo. The mark is an inline SVG so it works in the
   single file preview with no image request. Rounded square in the
   accent color from the design tokens, with a bold white letter Y
   drawn with strokes and round caps and joins. The wordmark is styled
   text, not baked into the SVG, so it stays sharp at any size. */

export default function Logo() {
  return (
    <span className="logo">
      <svg
        className="logo-mark"
        viewBox="0 0 48 48"
        role="img"
        aria-label="Yerzzir Store logo mark"
      >
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="10"
          style={{ fill: 'var(--color-accent)' }}
        />
        <path
          d="M15 13 L24 26 L33 13 M24 26 L24 36"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: 'var(--color-surface)' }}
        />
      </svg>
      <span className="logo-wordmark">{site.brandName}</span>
    </span>
  )
}
