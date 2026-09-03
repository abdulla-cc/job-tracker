import { motion } from "framer-motion";
import { MouseEvent, useEffect, useState, useCallback } from "react";

type HolographicWallProps = {
  intensity?: number;
  radius?: number;
};

// Pharaonic hieroglyphic symbols
const HIEROGLYPHS = [
  "𓄿", "𓇋", "𓅱", "𓃀", "𓊪", "𓆑", "𓅓", "𓈖", "𓂋", "𓉔",
  "𓎛", "𓐍", "𓄡", "𓋴", "𓈙", "𓈎", "𓎡", "𓎼", "𓏏", "𓂧",
];

export function HolographicWall({
  intensity = 0.8,
  radius = 200,
}: HolographicWallProps) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [letters, setLetters] = useState<Array<{ char: string; x: number; y: number }>>([]);

  const generateLetters = useCallback(() => {
    const cols = Math.floor(window.innerWidth / 50);
    const rows = Math.floor(window.innerHeight / 50);
    const spacingX = window.innerWidth / cols;
    const spacingY = window.innerHeight / rows;
    const newLetters: Array<{ char: string; x: number; y: number }> = [];

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        newLetters.push({
          char: HIEROGLYPHS[Math.floor(Math.random() * HIEROGLYPHS.length)],
          x: i * spacingX + (Math.random() - 0.5) * 10,
          y: j * spacingY + (Math.random() - 0.5) * 10,
        });
      }
    }
    setLetters(newLetters);
  }, []);

  useEffect(() => {
    generateLetters();
    window.addEventListener("resize", generateLetters);
    return () => window.removeEventListener("resize", generateLetters);
  }, [generateLetters]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#0a0a0a',
        zIndex: 0,
      }}
    >
      {/* Hieroglyphs */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {letters.map((letter, index) => {
          const distance = mousePosition
            ? Math.sqrt(
                Math.pow(letter.x - mousePosition.x, 2) +
                Math.pow(letter.y - mousePosition.y, 2)
              )
            : Infinity;

          const letterIntensity =
            mousePosition && distance < radius
              ? Math.max(0, 1 - distance / radius) * intensity
              : 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0.12 }}
              animate={{
                opacity:
                  mousePosition && distance < radius
                    ? 0.12 + letterIntensity
                    : 0.12,
                scale: mousePosition && distance < radius ? 1.3 : 1,
                color:
                  mousePosition && distance < radius
                    ? `rgba(139, 94, 60, ${0.3 + letterIntensity})`
                    : "rgba(139, 94, 60, 0.12)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                position: 'absolute',
                left: letter.x,
                top: letter.y,
                fontSize: '0.875rem',
                pointerEvents: 'none',
                userSelect: 'none',
                textShadow:
                  mousePosition && distance < radius
                    ? `0 0 ${letterIntensity * 25}px rgba(139, 94, 60, ${letterIntensity})`
                    : "none",
              }}
            >
              {letter.char}
            </motion.div>
          );
        })}
      </div>

      {/* Cursor glow */}
      {mousePosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: intensity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <div
            style={{
              position: 'absolute',
              left: mousePosition.x,
              top: mousePosition.y,
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(139, 94, 60, 0.4) 0%, rgba(139, 94, 60, 0.15) 30%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default HolographicWall;
