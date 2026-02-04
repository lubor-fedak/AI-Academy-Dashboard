'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

const KYNDRYL_RED = '#FF462D';

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
}

// Seeded random number generator for deterministic particle positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export default function AIAcademyIntroPage() {
  const [countdown, setCountdown] = useState(10);
  const [showCountdown, setShowCountdown] = useState(true);
  const [phase, setPhase] = useState(0);
  const [showReplay, setShowReplay] = useState(false);

  // Use seeded random for deterministic particle positions (pure function)
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: seededRandom(i * 7 + 1) * 100,
      top: seededRandom(i * 13 + 2) * 100,
      size: seededRandom(i * 17 + 3) * 3 + 1,
      duration: seededRandom(i * 23 + 4) * 20 + 10,
      delay: seededRandom(i * 29 + 5) * 5,
    })), []);

  const startMainAnimation = useCallback(() => {
    const timeline = [
      { delay: 500, phase: 1 },
      { delay: 2500, phase: 2 },
      { delay: 5500, phase: 3 },
      { delay: 9000, phase: 4 },
      { delay: 12000, phase: 5 },
      { delay: 13500, phase: 6 },
      { delay: 15500, phase: 7 },
      { delay: 20000, phase: 8 },
      { delay: 23000, phase: 9 },
      { delay: 26000, phase: 10 },
      { delay: 30000, phase: 11 },
      { delay: 32000, phase: 12 },
      { delay: 35000, phase: 13 },
      { delay: 38000, phase: 14 },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    timeline.forEach(({ delay, phase: p }) => {
      const timeout = setTimeout(() => {
        setPhase(p);
        if (p === 14) setShowReplay(true);
      }, delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
  }, []);

  const handleReplay = useCallback(() => {
    setCountdown(10);
    setShowCountdown(true);
    setPhase(0);
    setShowReplay(false);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!showCountdown) return;

    if (countdown <= 0) {
      const timer = setTimeout(() => {
        setShowCountdown(false);
        startMainAnimation();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, showCountdown, startMainAnimation]);

  if (showCountdown) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden font-sans flex flex-col items-center justify-center">
        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
            50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          }
        `}</style>

        {/* Particles */}
        <div className="absolute inset-0 opacity-20">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: KYNDRYL_RED,
                animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="text-center z-10">
          <p className="text-gray-400 text-xl md:text-2xl tracking-wider mb-8">
            Kyndryl AI Academy starts in
          </p>

          <div
            className="text-8xl md:text-9xl font-bold mb-8 transition-all duration-300"
            style={{
              color: countdown <= 3 ? KYNDRYL_RED : 'white',
              transform: `scale(${countdown === 0 ? 1.2 : 1})`,
            }}
          >
            {countdown}
          </div>

          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="#333" strokeWidth="4" fill="none" />
              <circle
                cx="64" cy="64" r="58"
                stroke={KYNDRYL_RED}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={364}
                strokeDashoffset={364 - (364 * (10 - countdown)) / 10}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Particles */}
      <div className="absolute inset-0 opacity-30">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: KYNDRYL_RED,
              animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Background gradient */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          phase >= 5 && phase < 11 ? 'opacity-0' : phase >= 11 ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(100,30,20,0.3) 0%, rgba(0,0,0,0.9) 70%)',
        }}
      />

      {/* Stars circle - Phase 1-4 */}
      <div
        className={`absolute top-20 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${
          phase >= 1 && phase < 5 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="relative w-24 h-24">
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = Math.cos(angle) * 40 + 48;
            const y = Math.sin(angle) * 40 + 48;
            return (
              <div
                key={i}
                className="absolute text-yellow-400 text-lg"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`,
                }}
              >
                ★
              </div>
            );
          })}
        </div>
      </div>

      {/* Quote - Phase 2-4 */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-12 transition-opacity duration-1000 ${
          phase >= 2 && phase < 5 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-4xl text-center">
          <p
            className={`text-gray-400 text-sm uppercase tracking-widest mb-6 transition-all duration-700 ${
              phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            EU Digital Commissioner, 2025
          </p>

          <blockquote className="space-y-4">
            <p
              className={`text-white text-2xl md:text-3xl font-light leading-relaxed transition-all duration-700 ${
                phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              &ldquo;Europe is falling behind.
            </p>
            <p
              className={`text-white text-2xl md:text-3xl font-light leading-relaxed transition-all duration-700 ${
                phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Not because we lack talent. But because we&apos;re still learning AI from 2023.
            </p>
            <p
              className={`text-2xl md:text-3xl font-medium leading-relaxed transition-all duration-700 ${
                phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ color: KYNDRYL_RED }}
            >
              The world has moved on. <span className="text-white">You must move with it.&rdquo;</span>
            </p>
          </blockquote>
        </div>
      </div>

      {/* Mission - Phase 6-7 */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-12 transition-opacity duration-1000 ${
          phase >= 6 && phase < 8 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-4xl text-center">
          <p
            className={`text-xl uppercase tracking-widest mb-8 transition-all duration-700 ${
              phase >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ color: KYNDRYL_RED }}
          >
            Your Mission
          </p>

          <p
            className={`text-white text-3xl md:text-4xl font-light leading-relaxed transition-all duration-1000 ${
              phase >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            In <span className="font-semibold" style={{ color: KYNDRYL_RED }}>6 weeks</span>, you will become those who
            <br />
            <span className="font-semibold">change the rules of the game</span>
          </p>

          <p
            className={`text-gray-400 text-xl mt-8 transition-all duration-1000 ${
              phase >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            ...for Kyndryl, for Europe, and for <span className="text-white">you</span>.
          </p>
        </div>
      </div>

      {/* Academy Logo - Phase 8-10 */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-[1500ms] ${
          phase >= 8 && phase < 11 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute top-1/2 left-0 h-px transition-all duration-[1500ms] ${
              phase >= 8 ? 'w-full' : 'w-0'
            }`}
            style={{
              transform: 'translateY(-100px)',
              background: `linear-gradient(to right, transparent, ${KYNDRYL_RED}, transparent)`,
            }}
          />
          <div
            className={`absolute top-1/2 left-0 h-px transition-all duration-[1500ms] ${
              phase >= 8 ? 'w-full' : 'w-0'
            }`}
            style={{
              transform: 'translateY(100px)',
              background: `linear-gradient(to right, transparent, ${KYNDRYL_RED}, transparent)`,
            }}
          />
        </div>

        <div
          className={`transition-all duration-[1500ms] ${
            phase >= 8 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <div className="text-center">
            <div className="mb-2">
              <span className="text-white text-5xl md:text-6xl font-bold tracking-tight">
                Kyndryl
              </span>
            </div>

            <div
              className={`transition-all duration-[1500ms] ${
                phase >= 9 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <span
                className="text-3xl md:text-4xl font-light tracking-widest"
                style={{ color: KYNDRYL_RED }}
              >
                AI ACADEMY
              </span>
            </div>

            <div
              className={`mt-8 transition-all duration-[1500ms] ${
                phase >= 10 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <span className="text-gray-500 text-lg tracking-wider">
                February — March 2026
              </span>
            </div>

            <div
              className={`mt-4 transition-all duration-[1500ms] ${
                phase >= 10 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="text-gray-600 text-sm uppercase tracking-widest">
                Brno, Czech Republic
              </span>
            </div>
          </div>
        </div>

        {/* Role badges */}
        <div
          className={`absolute bottom-20 flex flex-wrap justify-center gap-3 px-8 max-w-2xl transition-all duration-[1500ms] ${
            phase >= 10 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {['FDE', 'AI-SE', 'AI-PM', 'AI-FE', 'AI-SEC', 'AI-DA', 'AI-DS'].map((role, i) => (
            <span
              key={role}
              className="px-3 py-1 bg-gray-900 rounded text-gray-400 text-xs tracking-wide"
              style={{
                border: `1px solid rgba(255, 70, 45, 0.4)`,
                animation: phase >= 10 ? `fadeInUp 0.8s ease-out ${i * 0.15}s both` : 'none',
              }}
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Final - Operation AI Ready Europe - Phase 12+ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-[2000ms] ${
          phase >= 12 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, rgba(255, 70, 45, 0.15) 0%, rgba(0,0,0,1) 60%)`,
          }}
        />

        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute top-1/3 left-0 h-px transition-all duration-[2000ms] ${
              phase >= 12 ? 'w-full' : 'w-0'
            }`}
            style={{
              background: `linear-gradient(to right, transparent, rgba(255,70,45,0.25), transparent)`,
            }}
          />
          <div
            className={`absolute top-2/3 left-0 h-px transition-all duration-[2000ms] ${
              phase >= 12 ? 'w-full' : 'w-0'
            }`}
            style={{
              background: `linear-gradient(to right, transparent, rgba(255,70,45,0.25), transparent)`,
            }}
          />
        </div>

        <div className="text-center z-10">
          <p
            className={`text-gray-500 text-sm uppercase tracking-widest mb-4 transition-all duration-1000 ${
              phase >= 12 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Codename
          </p>

          <h1
            className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider mb-6 transition-all duration-[1500ms] ${
              phase >= 12 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
            }`}
            style={{
              color: KYNDRYL_RED,
              textShadow: `0 0 60px rgba(255,70,45,0.4), 0 0 120px rgba(255,70,45,0.2)`,
            }}
          >
            OPERATION
            <br />
            AI READY EUROPE
          </h1>

          <p
            className={`text-white text-xl md:text-2xl tracking-wide mt-8 transition-all duration-[1500ms] ${
              phase >= 13 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Welcome aboard.
          </p>

          <p
            className={`text-gray-600 text-sm uppercase tracking-widest mt-12 transition-all duration-[1500ms] ${
              phase >= 13 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            By Kyndryl
          </p>
        </div>
      </div>

      {/* Replay button */}
      {showReplay && (
        <button
          onClick={handleReplay}
          className="absolute bottom-8 right-8 px-4 py-2 text-white rounded-lg transition-all text-sm hover:scale-105 z-50"
          style={{ backgroundColor: KYNDRYL_RED }}
        >
          ▶ Replay
        </button>
      )}
    </div>
  );
}
