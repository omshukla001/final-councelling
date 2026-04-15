import {
  HeroSection,
  TrustStrip,
  FeaturesSection,
  StatsBar,
  HowItWorks,
  WhyChooseUs,
  PricingSection,
  TrustSection,
  CTASection,
} from "./landing";

const Index = () => (
  <div className="min-h-screen text-stone-900 overflow-x-hidden relative">
    <HeroSection />
    <TrustStrip />
    <FeaturesSection />
    <StatsBar />
    <HowItWorks />
    <WhyChooseUs />
    <PricingSection />
    <TrustSection />
    <CTASection />
  </div>
);

export default Index;
