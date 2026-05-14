import { FeaturesGrid } from "@/components/landing/features-grid";
import { Hero } from "@/components/landing/hero";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-8">
        <Hero />
        <FeaturesGrid />
      </main>
      <Footer />
    </>
  );
}
