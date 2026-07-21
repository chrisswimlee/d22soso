import Hero from "@/components/Hero";
import TwoHandHoldemDemo from "@/components/TwoHandHoldemDemo";
import CareerTimeline from "@/components/CareerTimeline";
import ApmTestWidget from "@/components/ApmTestWidget";
import MediaHub from "@/components/MediaHub";
import ContactSection from "@/components/ContactSection";
import PhotoBreak from "@/components/PhotoBreak";

export default function Home() {
  return (
    <>
      <Hero />
      <TwoHandHoldemDemo />
      <PhotoBreak
        src="/sc-championship.webp"
        alt="Wayne D22-soso Chiang with StarCraft Brood War championship trophy"
        kicker="1999"
        caption="First official Brood War World Champion — Random."
        objectPosition="center 30%"
      />
      <CareerTimeline />
      <ApmTestWidget />
      <PhotoBreak
        src="/wsop-boxer.webp"
        alt="Wayne Chiang with SlayerS_BoxeR at the World Series of Poker"
        kicker="WSOP"
        caption="From esports pioneer to poker media desk."
        objectPosition="center 25%"
      />
      <MediaHub />
      <ContactSection />
    </>
  );
}
