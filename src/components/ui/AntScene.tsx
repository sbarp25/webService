"use client";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as PIXI from 'pixi.js';

export interface AntSceneProps {
    text?: string;
    imageUrl?: string;
    particleColor?: number;
    bgColor?: number;
    step?: number;
    contained?: boolean;
    onAppInit?: (app: PIXI.Application) => void;
}

export default function AntScene({
    text,
    imageUrl,
    particleColor = 0xffffff,
    bgColor,
    step = 6,
    contained = true,
    onAppInit
}: AntSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [app, setApp] = useState<PIXI.Application | null>(null);
    const antsContainerRef = useRef<PIXI.Container | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // 1. Initialize PIXI App (Once)
    useEffect(() => {
        if (!isClient || !containerRef.current) return;

        let pixiApp: PIXI.Application | null = null;

        const initPixi = async () => {
            try {
                const width = containerRef.current!.clientWidth || window.innerWidth;
                const height = containerRef.current!.clientHeight || window.innerHeight;

                pixiApp = new PIXI.Application();
                await pixiApp.init({
                    width,
                    height,
                    backgroundColor: bgColor !== undefined ? bgColor : 0x000000,
                    backgroundAlpha: bgColor !== undefined ? 1 : 0,
                    resolution: 2, // Force higher resolution
                    autoDensity: true,
                    antialias: true,
                    resizeTo: contained ? containerRef.current! : window,
                });

                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                    containerRef.current.appendChild(pixiApp.canvas as HTMLCanvasElement);
                }

                const antsContainer = new PIXI.Container();
                pixiApp.stage.addChild(antsContainer);
                antsContainerRef.current = antsContainer;

                setApp(pixiApp);
                if (onAppInit) onAppInit(pixiApp);

            } catch (err) {
                console.error('AntScene init error:', err);
            }
        };

        initPixi();

        return () => {
            if (pixiApp) {
                pixiApp.destroy({ removeView: true });
                setApp(null);
            }
        };
    }, [isClient, contained]);

    // Handle background color changes dynamically
    useEffect(() => {
        if (app && bgColor !== undefined) {
            app.renderer.background.color = bgColor;
            app.renderer.background.alpha = 1;
        } else if (app) {
            app.renderer.background.alpha = 0;
        }
    }, [app, bgColor]);

    // 2. Handle Text/Image Updates & Animation Loop
    useEffect(() => {
        if (!app || !antsContainerRef.current) return;
        if (!text && !imageUrl) {
            antsContainerRef.current.removeChildren();
            return;
        }

        const container = antsContainerRef.current;
        container.removeChildren();

        const width = app.screen.width;
        const height = app.screen.height;

        if (width === 0 || height === 0) return;

        const processPixels = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return [];

            if (imageUrl) {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageUrl;
                });

                // Scale image to fit canvas cover/contain
                const scale = Math.min(width / img.width, height / img.height) * 0.8;
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (width - w) / 2;
                const y = (height - h) / 2;
                ctx.drawImage(img, x, y, w, h);
            } else if (text) {
                ctx.fillStyle = '#ffffff';
                const lines = text.split(/\n|\\n/);
                let fontSize = 200;
                ctx.font = `bold ${fontSize}px Arial, sans-serif`;

                const maxLW = Math.max(...lines.map(l => ctx.measureText(l).width));
                if (maxLW > width * 0.9) fontSize *= (width * 0.9) / maxLW;

                const totalH = lines.length * (fontSize * 1.2);
                if (totalH > height * 0.8) fontSize *= (height * 0.8) / totalH;

                const finalFS = Math.floor(fontSize);
                const lh = finalFS * 1.2;
                ctx.font = `bold ${finalFS}px Arial, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const startY = (height - (lines.length * lh)) / 2 + (lh / 2);
                lines.forEach((line, i) => {
                    ctx.fillText(line, width / 2, startY + i * lh);
                });
            }

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const targets: { x: number, y: number, color?: number }[] = [];

            for (let i = 0; i < data.length; i += 4 * step) {
                if (data[i + 3] > 128) {
                    const pixelIndex = i / 4;
                    const x = pixelIndex % width;
                    const y = Math.floor(pixelIndex / width);
                    if (x % step === 0 && y % step === 0) {
                        // If it's an image, we can try to grab the color
                        let color = particleColor;
                        if (imageUrl) {
                            color = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
                        }
                        targets.push({ x, y, color });
                    }
                }
            }
            return targets;
        };

        processPixels().then(targets => {
            if (!targets.length) return;

            // --- Create Ant Sprites ---
            // Use a base graphic for all ants if they are the same color, 
            // but for images they might have different colors.
            // For now, let's keep it simple: one texture, different tints.
            const antGraphic = new PIXI.Graphics();
            antGraphic.fill(0xffffff); // Base white so tint works
            antGraphic.ellipse(-3, 0, 3, 1.5);
            antGraphic.ellipse(1.5, 0, 1.5, 1.2);
            antGraphic.fill();
            const antTexture = app.renderer.generateTexture(antGraphic);

            const ants = targets.map((target) => {
                const ant = new PIXI.Sprite(antTexture);
                ant.anchor.set(0.5);
                ant.tint = target.color || particleColor;

                const angle = Math.random() * Math.PI * 2;
                const radius = Math.max(width, height) * (1.2 + Math.random() * 0.4);
                const startX = width / 2 + Math.cos(angle) * radius;
                const startY = height / 2 + Math.sin(angle) * radius;

                ant.x = startX;
                ant.y = startY;

                const dx = target.x - startX;
                const dy = target.y - startY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const offsetMag = Math.min(dist * 0.3, 200);

                (ant as any).props = {
                    p0: { x: startX, y: startY },
                    p1: {
                        x: startX + dx * 0.33 + (Math.random() - 0.5) * offsetMag,
                        y: startY + dy * 0.33 + (Math.random() - 0.5) * offsetMag,
                    },
                    p2: {
                        x: startX + dx * 0.66 + (Math.random() - 0.5) * offsetMag,
                        y: startY + dy * 0.66 + (Math.random() - 0.5) * offsetMag,
                    },
                    p3: { x: target.x, y: target.y },
                    phase: Math.random() * Math.PI * 2,
                    zigzagFreq: 8 + Math.random() * 8,
                    zigzagAmp: 1 + Math.random() * 2,
                };

                container.addChild(ant);
                return ant;
            });

            // --- Animation Cycle ---
            let startTime = Date.now();
            const formDur = 2000;
            const holdDur = 1000;
            const scatterDur = 1500;

            const cubicBezier = (t: number, p0: number, p1: number, p2: number, p3: number) => {
                const it = 1 - t, it2 = it * it, it3 = it2 * it, t2 = t * t, t3 = t2 * t;
                return it3 * p0 + 3 * it2 * t * p1 + 3 * it * t2 * p2 + t3 * p3;
            };

            const cubicTangent = (t: number, p0: number, p1: number, p2: number, p3: number) => {
                const it = 1 - t;
                return 3 * it * it * (p1 - p0) + 6 * it * t * (p2 - p1) + 3 * t * t * (p3 - p2);
            };

            const tickerCallback = () => {
                const elapsed = Date.now() - startTime;
                let progress = 0;

                // Simple loop: Form -> Hold -> Scatter -> Loop
                const cycleTotal = formDur + holdDur + scatterDur;
                const cycleElapsed = elapsed % cycleTotal;

                if (cycleElapsed < formDur) {
                    progress = 1 - Math.pow(1 - (cycleElapsed / formDur), 3); // Ease out
                } else if (cycleElapsed < formDur + holdDur) {
                    progress = 1;
                } else {
                    const scatterT = (cycleElapsed - formDur - holdDur) / scatterDur;
                    progress = 1 - Math.pow(scatterT, 2); // Ease in
                }

                const now = Date.now() / 1000;

                ants.forEach((ant: any) => {
                    const { p0, p1, p2, p3, phase, zigzagFreq, zigzagAmp } = ant.props;

                    const bx = cubicBezier(progress, p0.x, p1.x, p2.x, p3.x);
                    const by = cubicBezier(progress, p0.y, p1.y, p2.y, p3.y);

                    if (progress > 0.01 && progress < 0.99) {
                        const tx = cubicTangent(progress, p0.x, p1.x, p2.x, p3.x);
                        const ty = cubicTangent(progress, p0.y, p1.y, p2.y, p3.y);
                        const len = Math.sqrt(tx * tx + ty * ty) || 1;
                        const nx = tx / len, ny = ty / len;
                        const px = -ny, py = nx; // perpendicular

                        const scatterFactor = Math.min(1, (1 - progress) * 3);
                        const zigzag = Math.sin(now * zigzagFreq + phase) * zigzagAmp * scatterFactor;

                        ant.x = bx + px * zigzag;
                        ant.y = by + py * zigzag;
                        ant.rotation = Math.atan2(ty, tx) + Math.cos(now * 5 + phase) * 0.1 * scatterFactor;
                        ant.alpha = Math.min(1, progress * 4);
                    } else if (progress >= 0.99) {
                        ant.x = bx;
                        ant.y = by;
                        ant.rotation = Math.sin(now * 2 + phase) * 0.05;
                        ant.alpha = 1;
                    } else {
                        ant.x = bx;
                        ant.y = by;
                        ant.alpha = 0;
                    }
                });
            };

            app.ticker.add(tickerCallback);
            (app as any)._cleanup = () => app.ticker.remove(tickerCallback);
        });

        return () => {
            if ((app as any)._cleanup) (app as any)._cleanup();
        };

    }, [app, text, imageUrl, particleColor, step]);

    return <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
