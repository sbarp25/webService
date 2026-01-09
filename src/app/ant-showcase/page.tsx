"use client";
import React, { useState, useEffect } from 'react';
import AntScene from '@/components/ui/AntScene';
import { motion } from 'framer-motion';

const WORDS = ["SABRP", "PHOTO", "APPS", "TOOLS", "ANT"];

export default function AntShowcasePage() {
    const [currentWordIdx, setCurrentWordIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWordIdx((prev) => (prev + 1) % WORDS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-white/20">
            {/* Hero Section - Auto Mode */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="z-10 text-center px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black mb-4 tracking-tighter"
                    >
                        ANT PARTICLE <span className="text-[#EDEDED]">ENGINE</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto"
                    >
                        A high-performance PIXI.js powered particle system that forms words and shapes dynamically.
                    </motion.p>
                </div>

                {/* The Ant Scene in Auto Mode */}
                <AntScene
                    text={WORDS[currentWordIdx]}
                    mode="auto"
                    contained={false}
                />

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-1">
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    </div>
                </div>
            </section>

            {/* Scroll Section - Scroll Mode */}
            <section className="relative min-h-[300vh] pt-20">
                <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                    <div id="scroll-target" className="w-[80vw] h-[60vh] flex items-center justify-center">
                        {/* 
                            This div is just a reference for the scroll trigger.
                            The AntScene will position itself over this div in 'scroll' mode.
                        */}
                    </div>

                    <AntScene
                        targetId="scroll-target"
                        text="SCROLL\nME"
                        mode="scroll"
                        contained={false}
                    />
                </div>

                <div className="relative z-10 space-y-[100vh] pb-[50vh] px-10">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-bold mb-4">Precision Bezier Curves</h2>
                        <p className="text-white/60">
                            Each ant follows a unique cubic Bezier path from outer space to its designated target pixel.
                            The paths are randomized but consistent, creating a chaotic yet organized transition.
                        </p>
                    </div>
                    <div className="max-w-xl mr-auto text-right">
                        <h2 className="text-3xl font-bold mb-4">Dynamic Zig-Zag</h2>
                        <p className="text-white/60">
                            The ants don't just move; they scurry. A procedural noise-based zig-zag effect is applied
                            perpendicular to their path tangent, simulating realistic insect behavior.
                        </p>
                    </div>
                    <div className="max-w-xl mx-auto text-center border-t border-white/10 pt-20">
                        <h2 className="text-3xl font-bold mb-4">Wiggle & Orientation</h2>
                        <p className="text-white/60">
                            Sprites automatically rotate to face their movement direction,
                            with a subtle wiggle phase when they are near or at their targets.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 text-center border-t border-white/5">
                <p className="text-white/20 text-sm">Built with PIXI.js & Next.js</p>
            </footer>
        </main>
    );
}
