
import React from 'react';

const ZooLabsLogo = () => (
    <div className="flex items-center space-x-3">
        <img src="/hanzo-h-white.svg" alt="Zoo" className="h-10 w-auto" />
        <span className="text-3xl font-bold text-white">Zoo Labs</span>
    </div>
);

const NvidiaInceptionLogo = () => (
    <div className="flex flex-col items-center justify-center gap-1.5">
        <img src="/nvidia-logo-clean.svg" alt="NVIDIA" className="h-12 w-auto" />
    </div>
);

const TechstarsLogo = () => (
    <div className="flex items-center justify-center">
        <img src="/techstars-green.png" alt="Techstars" className="h-10 w-auto" />
    </div>
);

const DigitalOceanLogo = () => (
    <div className="flex items-center justify-center">
        <img src="/digitalocean-2.svg" alt="DigitalOcean" className="h-8 w-auto" />
    </div>
);


const Partners: React.FC = () => {
  return (
    <section className="py-12 bg-dark-bg">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-16">
          <ZooLabsLogo />
          <div className="h-10 w-px bg-gray-700 hidden md:block"></div>
          <NvidiaInceptionLogo />
          <div className="h-10 w-px bg-gray-700 hidden md:block"></div>
          <TechstarsLogo />
          <div className="h-10 w-px bg-gray-700 hidden md:block"></div>
          <DigitalOceanLogo />
        </div>
      </div>
    </section>
  );
};

export default Partners;
