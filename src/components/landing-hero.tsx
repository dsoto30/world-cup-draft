import WorldCupScene from './world-cup-scene'

export default function LandingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-surface px-4 text-on-surface">
      <div className="absolute inset-0 landing-stadium" aria-hidden />
      <WorldCupScene />

      <div className="relative z-20 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center pb-20 pt-28 text-center">
        <div className="landing-ball mb-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/80 bg-white shadow-2xl md:h-36 md:w-36">
          <div className="h-12 w-12 rotate-45 rounded-lg bg-surface md:h-16 md:w-16" />
        </div>

        <h1 className="mx-auto max-w-4xl text-balance font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-gold sm:text-5xl md:text-6xl lg:text-6xl">
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
