import { AnimatedMarqueeHero } from "@/components/ui/hero-3";
import CTAWithVerticalMarquee from "@/components/ui/cta-with-text-marquee";
import FaqSection from "@/components/ui/faq-sections";
import { Features } from "@/components/Features";

// Unsplash stock images for the hero marquee (startup / workspace themed)
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&auto=format&fit=crop&q=60",
];

export function Landing() {
  const goToReview = () => {
    window.location.hash = "#/app";
  };
  const goToFaq = () => {
    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main>
      <AnimatedMarqueeHero
        tagline="Follows YC's official guidance on AI"
        title={
          <>
            YC Applications,
            <br />
            Finally Within Reach
          </>
        }
        description="Batchize scores your draft answers the way a partner reads them. Clarity, evidence, insight, ambition. It flags the invisible mistakes before you hit submit."
        ctaText="I'm Ready"
        images={HERO_IMAGES}
        onCtaClick={goToReview}
      />

      <Features />

      <CTAWithVerticalMarquee onPrimary={goToReview} onSecondary={goToFaq} />

      <section id="faq" className="py-24">
        <FaqSection />
      </section>
    </main>
  );
}
