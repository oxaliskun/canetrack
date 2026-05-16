import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Loader2 } from 'lucide-react';

const words = [
  "Preparing your dashboard...",
  "Syncing recent records...",
  "Validating secure session...",
  "Loading CaneTrack..."
];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 400);

    const timer = setTimeout(() => {
      onComplete();
    }, 1600);

    return () => {
      clearInterval(wordInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-slate-900 overflow-hidden"
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        className="relative flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center w-24 h-24 mb-6 bg-emerald-50 rounded-[2rem] shadow-sm border border-emerald-100">
          <FileText className="w-10 h-10 text-emerald-600" />
          <Loader2 className="absolute -bottom-2 -right-2 w-6 h-6 text-emerald-500 animate-spin" />
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-800">
          CaneTrack
        </h1>
        
        <div className="h-6 mt-2 flex items-center justify-center overflow-hidden w-full max-w-xs relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentWordIndex}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-slate-400 absolute w-full text-center"
            >
              {words[currentWordIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
