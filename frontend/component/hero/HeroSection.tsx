'use client'
import Image from "next/image";
import { Compass, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const HeroSection = () => {
  const router = useRouter();
  const { t } = useLanguage();
   
  return (
    <section className="relative flex min-h-[32rem] items-center overflow-hidden px-4 py-16 sm:px-8 sm:py-20 lg:min-h-[425px] lg:px-16 transition-colors">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero.png"
          alt="City with Bus"
          fill
          className="object-cover object-bottom-right opacity-90 dark:opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent"></div>
      </div>

      <div className="max-w-2xl relative z-10">
        <h1 className="mb-4 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
          {t("hero.title1")}
          <br />
          <span className="text-primary">{t("hero.title2")}</span>
        </h1>

        <p className="mb-8 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("hero.subtitle")}
        </p>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <button
            type="button"
            onClick={() => router.push("/track-bus")}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Navigation size={18} />
            {t("hero.track_btn")}
          </button>

          <button
            type="button"
            onClick={() => router.push("/journey-planner")}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Compass size={18} />
            {t("hero.journey_btn")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
