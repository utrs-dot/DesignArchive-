/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let startTime: number | null = null;
    const duration = 3000;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let time = 0;
    let lastTime = 0;

    const dotRings = [
      { radius: 20, count: 8 },
      { radius: 35, count: 12 },
      { radius: 50, count: 16 },
      { radius: 65, count: 20 },
      { radius: 80, count: 24 }
    ];

    const colors = {
      primary: "#ffffff",
      accent: "#dddddd"
    };

    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const smoothstep = (edge0: number, edge1: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    const hexToRgb = (hex: string): [number, number, number] => {
      if (hex.startsWith("#")) {
        return [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16)
        ];
      }
      return [255, 255, 255];
    };

    const interpolateColor = (color1: string, color2: string, t: number, opacity = 1) => {
      const rgb1 = hexToRgb(color1);
      const rgb2 = hexToRgb(color2);
      const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
      const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
      const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      const rgb = hexToRgb(colors.primary);
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
      ctx.fill();

      dotRings.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i++) {
          const angle = (i / ring.count) * Math.PI * 2;
          const pulseTime = time * 2 - ringIndex * 0.4;
          const radiusPulse = easeInOutSine((Math.sin(pulseTime) + 1) / 2) * 6 - 3;
          const x = centerX + Math.cos(angle) * (ring.radius + radiusPulse);
          const y = centerY + Math.sin(angle) * (ring.radius + radiusPulse);

          const opacityPhase = (Math.sin(pulseTime + i * 0.2) + 1) / 2;
          const opacityBase = 0.3 + easeInOutSine(opacityPhase) * 0.7;
          const highlightPhase = (Math.sin(pulseTime) + 1) / 2;
          const highlightIntensity = easeInOutCubic(highlightPhase);

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          const colorBlend = smoothstep(0.2, 0.8, highlightIntensity);
          ctx.fillStyle = interpolateColor(colors.primary, colors.accent, colorBlend, opacityBase);
          ctx.fill();
        }
      });

      if (timestamp - startTime >= duration) {
        if (overlayRef.current) {
          overlayRef.current.style.opacity = "0";
          setTimeout(onComplete, 800);
        }
        return;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black flex items-center justify-center z-[10000] transition-opacity duration-800 ease-in-out"
    >
      <canvas ref={canvasRef} width={300} height={300} />
    </div>
  );
}
