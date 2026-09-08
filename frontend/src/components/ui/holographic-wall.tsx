import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

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
  intensity = 0.85,
  radius = 230,
}: HolographicWallProps) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [letters, setLetters] = useState<Array<{ char: string; x: number; y: number }>>([]);

  const generateLetters = useCallback(() => {
    const cols = Math.floor(window.innerWidth / 48);
    const rows = Math.floor(window.innerHeight / 48);
    const spacingX = window.innerWidth / cols;
    const spacingY = window.innerHeight / rows;
    const newLetters: Array<{ char: string; x: number; y: number }> = [];

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        newLetters.push({
          char: HIEROGLYPHS[Math.floor(Math.random() * HIEROGLYPHS.length)],
          x: i * spacingX + (Math.random() - 0.5) * 8,
          y: j * spacingY + (Math.random() - 0.5) * 8,
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

  // Window-level mouse tracking for continuous smooth flashlight effect
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleMouseLeave = () => {
      setMousePosition(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#080706",
        zIndex: 0,
      }}
    >
      {/* Hieroglyphic Matrix */}
      <div style={{ position: "absolute", inset: 0 }}>
        {letters.map((letter, index) => {
          const distance = mousePosition
            ? Math.sqrt(
                Math.pow(letter.x - mousePosition.x, 2) +
                  Math.pow(letter.y - mousePosition.y, 2)
              )
            : Infinity;

          const isLit = mousePosition && distance < radius;
          const letterIntensity = isLit
            ? Math.max(0, 1 - distance / radius) * intensity
            : 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0.12 }}
              animate={{
                opacity: isLit ? Math.min(0.72, 0.12 + letterIntensity * 0.6) : 0.12,
                scale: isLit ? 1 + letterIntensity * 0.28 : 1,
                color: isLit
                  ? `rgba(225, 165, 115, ${Math.min(0.85, 0.35 + letterIntensity * 0.5)})`
                  : "rgba(139, 94, 60, 0.13)",
              }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              style={{
                position: "absolute",
                left: letter.x,
                top: letter.y,
                fontSize: "0.95rem",
                pointerEvents: "none",
                userSelect: "none",
                textShadow: isLit
                  ? `0 0 ${letterIntensity * 10}px rgba(205, 135, 75, ${letterIntensity * 0.5})`
                  : "none",
              }}
            >
              {letter.char}
            </motion.div>
          );
        })}
      </div>

      {/* Balanced, Smooth Ambient Spotlight */}
      {mousePosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <div
            style={{
              position: "absolute",
              left: mousePosition.x,
              top: mousePosition.y,
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(190, 125, 75, 0.38) 0%, rgba(150, 95, 55, 0.2) 35%, rgba(139, 94, 60, 0.08) 60%, transparent 75%)",
              filter: "blur(45px)",
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default HolographicWall;
