/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Heart } from "lucide-react";
import React, { useState } from "react";

export default function App() {
  // Using a more robust Google Drive direct link format
  const logoUrl = "https://lh3.googleusercontent.com/d/1tONlGz7wc53bSKjByCyvKYQOwKbllsyB";

  // Hardcoded spacing values from user selection
  const estdToLogoGap = 0;
  const logoToSpecialtiesGap = -47;
  const specialtiesToCtaGap = 81;

  // Interaction state
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [hue, setHue] = useState(0);

  // Sync with server function
  const syncWithServer = React.useCallback(async (localCount: number, isSync: boolean = true) => {
    try {
      const response = await fetch(`/api/likes?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentLocalCount: localCount, isSync })
      });
      const data = await response.json();
      const serverCount = data.count || 0;
      
      // Always take the higher value to ensure we never lose counts
      setLikes(prev => {
        const finalCount = Math.max(serverCount, prev, localCount);
        if (finalCount !== prev) {
          localStorage.setItem("studio_archive_likes", finalCount.toString());
        }
        return finalCount;
      });
    } catch (err) {
      console.error("Failed to sync likes:", err);
    }
  }, []);

  // Initial load and polling
  React.useEffect(() => {
    const savedLikes = parseInt(localStorage.getItem("studio_archive_likes") || "0");
    setLikes(savedLikes);

    // Initial sync
    syncWithServer(savedLikes, true);

    // Poll every 5 seconds for global updates
    const interval = setInterval(() => {
      const currentLikes = parseInt(localStorage.getItem("studio_archive_likes") || "0");
      syncWithServer(currentLikes, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [syncWithServer]);

  const handleLike = async () => {
    const newLocalCount = likes + 1;
    setLikes(newLocalCount);
    localStorage.setItem("studio_archive_likes", newLocalCount.toString());
    
    setIsLiked(true);
    setHue((prev) => (prev + 40) % 360);
    
    // Immediate sync on click
    syncWithServer(newLocalCount, false);

    // Reset heart animation state after a short delay
    setTimeout(() => setIsLiked(false), 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcfb] font-sans selection:bg-stone-200 selection:text-stone-900 px-6 overflow-hidden">
      {/* Subtle Background Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(231,229,228,0.3)_0%,_transparent_70%)]" />
      </div>

      <div className="flex flex-col items-center text-center max-w-2xl relative z-10">
        {/* Establishment Date at Top */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1.2 }}
        >
          <p className="text-[11px] md:text-xs tracking-[0.3em] text-stone-500 font-normal">
            Estd. 1990
          </p>
        </motion.div>

        {/* Spacer 1 */}
        <div style={{ height: `${estdToLogoGap}px` }} />

        {/* Logo and Specialties Grouped */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <img 
              src={logoUrl} 
              alt="Studio Logo" 
              className="h-48 md:h-72 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== "https://drive.google.com/uc?export=view&id=1tONlGz7wc53bSKjByCyvKYQOwKbllsyB") {
                  target.src = "https://drive.google.com/uc?export=view&id=1tONlGz7wc53bSKjByCyvKYQOwKbllsyB";
                } else {
                  target.src = "https://picsum.photos/seed/architecture/400/400";
                }
              }}
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          {/* Spacer 2 (Supports negative values) */}
          <div style={{ marginTop: `${logoToSpecialtiesGap}px` }} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.2 }}
          >
            <p className="font-serif text-lg md:text-xl tracking-[0.15em] text-stone-600 italic">
              Architects. Interior designers.
            </p>
          </motion.div>
        </div>

        {/* Spacer 3 */}
        <div style={{ height: `${specialtiesToCtaGap}px` }} />

        {/* Interaction Section */}
        <div className="flex items-center gap-6">
          <p className="font-serif text-stone-500 text-sm md:text-base tracking-[0.1em] italic">
            Live soon
          </p>
          
          <button 
            onClick={handleLike}
            className="flex items-center gap-2 group transition-all duration-300 outline-none"
          >
            <motion.div
              animate={isLiked ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Heart 
                size={16} 
                style={{ 
                  filter: likes > 0 ? `hue-rotate(${hue}deg)` : 'none',
                  transition: 'filter 0.3s ease'
                }}
                className={`transition-all duration-300 ${likes > 0 ? 'fill-rose-500 stroke-rose-500' : 'stroke-stone-400 group-hover:stroke-rose-400'}`} 
              />
            </motion.div>
            <span className="text-[11px] text-stone-400 font-mono tracking-wider">{likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}


