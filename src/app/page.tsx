import FormationSelect from '@/components/formation-select'
import LandingHero from '@/components/landing-hero'

export default function HomePage() {
  return (
    <main>
      <LandingHero />
      <section id="formation-selection" aria-label="Formation selection">
        <FormationSelect />
      </section>
    </main>
  )
}
