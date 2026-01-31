'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TheCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
}

const dialogLines = [
  {
    speaker: 'system',
    text: 'CLASSIFIED TRANSMISSION\nBrussels → New York\nJanuary 28, 2026, 19:47 CET',
    delay: 0,
  },
  {
    speaker: 'VON DER LEYEN',
    title: 'President, European Commission',
    text: "Martin, thank you for taking my call on short notice.",
    delay: 2000,
  },
  {
    speaker: 'SCHROETER',
    title: 'CEO, Kyndryl',
    text: "Madam President, always. What can Kyndryl do for Europe?",
    delay: 4000,
  },
  {
    speaker: 'VON DER LEYEN',
    title: 'President, European Commission',
    text: "I'll be direct. The AI Act comes into full effect in 12 months. Our enterprises are not ready. The latest assessment shows 73% of large EU companies have no clear AI transformation strategy.\n\nMeanwhile, American and Chinese competitors are deploying AI at scale. They're not just experimenting anymore - they're operationalizing. Every week we delay, we lose ground we may never recover.",
    delay: 6000,
  },
  {
    speaker: 'SCHROETER',
    title: 'CEO, Kyndryl',
    text: "I've seen the same data. It's concerning. But Ursula, this isn't a technology problem - it's an execution problem. Companies have access to the same tools. What they lack is the ability to deploy rapidly and at scale.",
    delay: 12000,
  },
  {
    speaker: 'VON DER LEYEN',
    title: 'President, European Commission',
    text: "Exactly. And that's why I'm calling you, not the big consulting firms. I've seen what happens when you throw armies of consultants at a problem. Eighteen months later, you have a beautiful strategy document and zero production systems.\n\nI need something different. I need teams that can go in fast, understand the problem, build a solution, and deploy it. Small, skilled, autonomous teams that can deliver results in weeks, not years.",
    delay: 18000,
  },
  {
    speaker: 'SCHROETER',
    title: 'CEO, Kyndryl',
    text: "You want rapid response teams for AI transformation.",
    delay: 26000,
  },
  {
    speaker: 'VON DER LEYEN',
    title: 'President, European Commission',
    text: "Yes. Exactly that. Small, elite, highly trained teams that can embed with our critical enterprises and deliver results in weeks, not years. Can you build me such a force?",
    delay: 28000,
  },
  {
    speaker: 'SCHROETER',
    title: 'CEO, Kyndryl',
    text: "We can. In fact, we've been developing something called the Kyndryl Agentic Framework - it's designed exactly for this. Rapid deployment of enterprise AI solutions. But a framework is just a tool. We need the people who can wield it.",
    delay: 32000,
  },
  {
    speaker: 'VON DER LEYEN',
    title: 'President, European Commission',
    text: "How fast can you train them?",
    delay: 38000,
  },
  {
    speaker: 'SCHROETER',
    title: 'CEO, Kyndryl',
    text: "Six weeks. Intensive. We select our best technical people from across Europe, put them through an immersive program, and at the end, they're ready for field deployment.",
    delay: 40000,
  },
  {
    speaker: 'VON DER LEYEN',
    title: 'President, European Commission',
    text: "Six weeks to create AI rapid response teams. It's ambitious.",
    delay: 45000,
  },
  {
    speaker: 'SCHROETER',
    title: 'CEO, Kyndryl',
    text: "It's necessary. The old way of consulting - endless discovery phases, bloated teams, custom everything - that's what got Europe into this position. We need to move like a startup with enterprise reliability.",
    delay: 48000,
  },
  {
    speaker: 'VON DER LEYEN',
    title: 'President, European Commission',
    text: "Do it. I'll arrange four pilot enterprises - one each in Germany, France, Italy, and the Netherlands. Major companies, critical sectors. If your teams can help them transform, we scale this across the Union.\n\nMartin, don't let Europe down.",
    delay: 54000,
  },
  {
    speaker: 'SCHROETER',
    title: 'CEO, Kyndryl',
    text: "We won't.\n\nOperation AI Ready Europe starts now.",
    delay: 62000,
  },
  {
    speaker: 'final',
    text: 'OPERATION AI READY EUROPE BY KYNDRYL\n\nYou have been selected.',
    delay: 68000,
  },
];

export function TheCallDialog({ isOpen, onClose, autoPlay = true }: TheCallDialogProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isOpen || showAll) return;

    if (!autoPlay) {
      setShowAll(true);
      setCurrentLine(dialogLines.length - 1);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    dialogLines.forEach((line, index) => {
      const timer = setTimeout(() => {
        setCurrentLine(index);
        setIsTyping(true);

        // Typewriter effect
        let charIndex = 0;
        const typeTimer = setInterval(() => {
          if (charIndex <= line.text.length) {
            setDisplayedText(line.text.slice(0, charIndex));
            charIndex++;
          } else {
            clearInterval(typeTimer);
            setIsTyping(false);
          }
        }, 20);

        timers.push(typeTimer as unknown as NodeJS.Timeout);
      }, line.delay);

      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isOpen, autoPlay, showAll]);

  const handleSkip = () => {
    setShowAll(true);
    setCurrentLine(dialogLines.length - 1);
    setDisplayedText(dialogLines[dialogLines.length - 1].text);
  };

  const currentLineData = dialogLines[currentLine];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-black/95 border-amber-500/30 p-0">
        {/* Header */}
        <div className="border-b border-amber-500/30 p-4 bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-amber-500 font-mono text-sm tracking-wider">ENCRYPTED CHANNEL</span>
            </div>
            <Badge variant="outline" className="border-amber-500/50 text-amber-500 font-mono">
              CLASSIFIED
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px] flex flex-col">
          {showAll ? (
            // Show final message when skipped or finished
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="space-y-2">
                <div className="text-5xl mb-4">🇪🇺</div>
                <h2 className="text-2xl font-bold text-amber-500 tracking-wide">
                  OPERATION AI READY EUROPE
                </h2>
                <p className="text-xl text-white/80">BY KYNDRYL</p>
              </div>
              <div className="border-t border-b border-amber-500/30 py-4 px-8">
                <p className="text-lg text-white/90">You have been selected.</p>
              </div>
              <Button
                onClick={onClose}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
              >
                Begin Your Mission
              </Button>
            </div>
          ) : (
            // Show dialog
            <>
              {currentLineData?.speaker === 'system' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2 font-mono">
                    {currentLineData.text.split('\n').map((line, i) => (
                      <p key={i} className={`${i === 0 ? 'text-amber-500 text-lg' : 'text-white/60 text-sm'}`}>
                        {showAll || !isTyping ? line : displayedText.split('\n')[i] || ''}
                      </p>
                    ))}
                  </div>
                </div>
              ) : currentLineData?.speaker === 'final' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-amber-500 tracking-wide">
                      {displayedText.split('\n')[0]}
                    </h2>
                    <p className="text-white/80">{displayedText.split('\n')[2]}</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4">
                  {/* Speaker info */}
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentLineData?.speaker === 'VON DER LEYEN'
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}>
                      {currentLineData?.speaker?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{currentLineData?.speaker}</p>
                      <p className="text-xs text-white/50">{currentLineData?.title}</p>
                    </div>
                  </div>

                  {/* Dialog text */}
                  <div className="bg-white/5 rounded-lg p-4 min-h-[200px]">
                    <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                      {displayedText}
                      {isTyping && <span className="animate-pulse">▊</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Progress and controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 bg-white/10 rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${((currentLine + 1) / dialogLines.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40">
                    {currentLine + 1} / {dialogLines.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-white/50 hover:text-white"
                >
                  Skip to End →
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
