const FLAGS = [
  ['#006847', '#ffffff', '#ce1126'],
  ['#009b3a', '#ffdf00', '#002776'],
  ['#c60b1e', '#ffc400', '#c60b1e'],
  ['#002395', '#ffffff', '#ed2939'],
  ['#00843d', '#ffffff', '#cd212a'],
  ['#75aadb', '#ffffff', '#fcbf49'],
  ['#000000', '#dd0000', '#ffce00'],
  ['#ae1c28', '#ffffff', '#21468b'],
]

const CONFETTI = [
  { left: '7%', color: '#f2ca50', delay: '0s', duration: '6.4s' },
  { left: '15%', color: '#86d89d', delay: '1.1s', duration: '5.8s' },
  { left: '24%', color: '#ffbfb8', delay: '0.5s', duration: '7s' },
  { left: '38%', color: '#ffffff', delay: '1.8s', duration: '6.2s' },
  { left: '51%', color: '#f2ca50', delay: '0.8s', duration: '5.6s' },
  { left: '63%', color: '#86d89d', delay: '1.4s', duration: '6.8s' },
  { left: '76%', color: '#ffbfb8', delay: '0.2s', duration: '6s' },
  { left: '88%', color: '#ffffff', delay: '1.7s', duration: '7.2s' },
]

export default function LandingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-surface px-4 text-on-surface">
      <div className="absolute inset-0 landing-stadium" aria-hidden />
      <div
        className="absolute inset-x-0 top-6 z-10 grid grid-cols-4 justify-items-center gap-2 px-4 sm:top-8 sm:flex sm:justify-center sm:gap-4 md:gap-7"
        aria-hidden
      >
        {FLAGS.map((colors, index) => (
          <div
            key={index}
            className="landing-flag h-8 w-12 overflow-hidden rounded-sm border border-white/20 shadow-lg sm:h-10 sm:w-14 md:h-12 md:w-16"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            {colors.map((color, stripeIndex) => (
              <span key={stripeIndex} className="block h-1/3 w-full" style={{ background: color }} />
            ))}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
        {CONFETTI.map((piece, index) => (
          <span
            key={index}
            className="landing-confetti"
            style={{
              left: piece.left,
              backgroundColor: piece.color,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
            }}
          />
        ))}
      </div>

      <div className="relative z-20 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center pb-20 pt-28 text-center">
        <div className="landing-ball mb-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/80 bg-white shadow-2xl md:h-36 md:w-36">
          <div className="h-12 w-12 rotate-45 rounded-lg bg-surface md:h-16 md:w-16" />
        </div>

        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight text-gold md:text-7xl lg:text-8xl">
          World Cup Legends Draft
        </h1>
        <p className="mt-5 max-w-2xl font-body text-base leading-7 text-on-surface-muted md:text-xl">
          Build a legendary XI from World Cup history, lock in your formation, and see if your squad
          can top the rating board.
        </p>

        <a
          href="#formation-selection"
          className="mt-9 rounded bg-gold px-10 py-4 font-body text-sm font-bold uppercase tracking-widest text-[#3c2f00] shadow-lg transition-all duration-200 hover:bg-gold-bright focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          style={{ boxShadow: '0 4px 28px rgba(242,202,80,0.3)' }}
        >
          Get Started
        </a>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-28 bg-gradient-to-t from-surface to-transparent" aria-hidden />
    </section>
  )
}
