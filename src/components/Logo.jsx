import { site } from '../config/site.js'

/* Yerzzir Store logo. The mark is an inline SVG so it works in the
   single file preview with no image request. A shopping bag in the
   accent color with a white play button on it, on a yellow tile: video
   commerce in one glance. The wordmark is styled text, not baked into
   the SVG, so it stays sharp at any size. */

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
          style={{ fill: 'var(--color-logo-yellow)' }}
        />
        <rect
          x="12"
          y="19"
          width="24"
          height="23"
          rx="5"
          style={{ fill: 'var(--color-accent)' }}
        />
        <path
          d="M18 19 C18 11.5 30 11.5 30 19"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ stroke: 'var(--color-accent)' }}
        />
        <polygon
          points="21,26 21,35 30.5,30.5"
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{ fill: 'var(--color-surface)', stroke: 'var(--color-surface)' }}
        />
        <path
          d="M36 34 Q36 41 29 41 L36 41 Z"
          style={{ fill: 'var(--color-logo-yellow)' }}
        />
      </svg>
      <span className="logo-wordmark">{site.brandName}</span>
    </span>
  )
}
