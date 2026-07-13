'use client'
import Image from "next/image";
import { Clock, Map, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";

const HeroSection = () => {
   const router = useRouter();
  return (
    <section className="relative flex min-h-212.5 items-center overflow-hidden px-8 py-20 lg:px-16">
      
      <div className="absolute inset-0 -z-10 w-full">
        <Image
          src="/hero.png"
          alt="City with Bus"
          fill
          className="object-cover opacity-30"
          priority
        />

       
        <div className="absolute inset-0 bg-linear-to-r from-white via-white/20 to-transparent"></div>
      </div>

    
      <div className="max-w-2xl">
        <h1 className="mb-4 text-5xl font-extrabold leading-tight lg:text-6xl">
          Smart Tracking.
          <br />
          <span className="text-primary">Smarter Travel.</span>
        </h1>

        <p className="mb-8 max-w-md text-lg leading-relaxed text-gray-600">
          Real-time bus tracking for a smarter commute. Know your bus. Plan your
          time. Reach on time.
        </p>

      
        <div className="mb-8 flex flex-wrap gap-4">
          <button  onClick={() => router.push("/track-bus")}
           className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:opacity-90">
            <Navigation size={18} />
            Track Your Bus
          </button>

          <button  onClick={() => router.push("/routes")}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium hover:bg-gray-100">
            <Map size={18} />
            View Routes
          </button>
        </div>

       
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Live Updates</span>
          </div>

          <span>•</span>

          <span>Accurate Tracking</span>

          <span>•</span>

          <span>Better Commute</span>
        </div>
      </div>

    
      <div className="absolute bottom-10 right-10 hidden max-w-xs items-center gap-6 rounded-2xl border bg-white p-5 shadow-xl lg:flex">

<section>
  <div className="mb-1 flex items-center gap-2">
    <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>

    <span className="text-xs font-bold uppercase text-primary">
      Live Bus
    </span>
  </div>

  <h2 className="text-3xl font-bold">12A</h2>

  <p className="text-xs text-gray-500">
    City Center → Airport
  </p>
</section>

<div className="h-12 w-px bg-gray-300"></div>

<section>
  <p className="text-xs text-gray-500">Next Stop</p>

  <h3 className="font-bold">Green Street</h3>

  <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-primary">
    <Navigation size={16} />
    <span>2 min away</span>
  </div>
</section>

</div>
    </section>
  );
};

export default HeroSection;
