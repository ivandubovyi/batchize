import { AnimatedMarqueeHero } from "@/components/ui/hero-3";
import CTAWithVerticalMarquee from "@/components/ui/cta-with-text-marquee";
import FaqSection from "@/components/ui/faq-sections";
import { Features } from "@/components/Features";
import { Insight } from "@/components/Insight";

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
        tagline="Free. No account needed. Nothing is uploaded unless you ask."
        title={
          <>
            YC Applications,
            <br />
            Finally Within Reach
          </>
        }
        description="Batchize reads your whole application the way a partner does: every answer against what that question is really asking, and every answer against the others. It quotes the exact words that will cost you. Free, no account needed, and nothing is uploaded unless you turn on sync."
        ctaText="I'm Ready"
        images={HERO_IMAGES}
        onCtaClick={goToReview}
      />

      <Features />

      <Insight />

      <CTAWithVerticalMarquee onPrimary={goToReview} onSecondary={goToFaq} />

      <section id="faq" className="py-24">
        <FaqSection />
      </section>
    </main>
  );
}
