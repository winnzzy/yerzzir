/* Scrolling announcement strip. Only true store facts appear here:
   the free Lagos delivery rule, Flutterwave secure checkout, and
   delivery across Nigeria. The facts render twice so the scroll loops
   seamlessly, and the strip pauses on hover. Motion stops entirely for
   users who prefer reduced motion. */

const facts = [
  'Free Lagos delivery on orders of ₦100,000 or more',
  'Secure checkout with Flutterwave',
  'Delivery across Nigeria, all 36 states and the FCT',
]

function FactGroup({ hidden }) {
  return (
    <span className="announcement-group" aria-hidden={hidden || undefined}>
      {facts.map((fact) => (
        <span key={fact}>{fact} •</span>
      ))}
    </span>
  )
}

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar" aria-label="Store announcements">
      <div className="announcement-track">
        <FactGroup />
        <FactGroup hidden />
      </div>
    </div>
  )
}
