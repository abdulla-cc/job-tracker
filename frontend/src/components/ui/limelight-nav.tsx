import React, { useState, useRef, useLayoutEffect, cloneElement, useEffect } from 'react';

// --- Types ---

export type NavItem = {
  id: string | number;
  icon: React.ReactElement;
  label?: string;
  onClick?: () => void;
};

type LimelightNavProps = {
  items: NavItem[];
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

/**
 * An adaptive-width navigation bar with a "limelight" spotlight effect
 * that highlights the active item.
 */
export const LimelightNav = ({
  items,
  activeIndex: controlledIndex,
  onTabChange,
  className = '',
  limelightClassName = '',
  iconContainerClassName = '',
  iconClassName = '',
}: LimelightNavProps) => {
  const [internalIndex, setInternalIndex] = useState(controlledIndex ?? 0);
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = controlledIndex ?? internalIndex;

  // Sync controlled index
  useEffect(() => {
    if (controlledIndex !== undefined) {
      setInternalIndex(controlledIndex);
    }
  }, [controlledIndex]);

  useLayoutEffect(() => {
    if (items.length === 0) return;

    const limelight = limelightRef.current;
    const activeItem = navItemRefs.current[activeIndex];
    
    if (limelight && activeItem) {
      const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;

      if (!isReady) {
        setTimeout(() => setIsReady(true), 50);
      }
    }
  }, [activeIndex, isReady, items]);

  if (items.length === 0) return null;

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    setInternalIndex(index);
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav className={`relative inline-flex items-center h-16 rounded-lg bg-card text-foreground border px-2 ${className}`}>
      {items.map(({ id, icon, label, onClick }, index) => (
        <button
          key={id}
          type="button"
          ref={(el) => { navItemRefs.current[index] = el; }}
          className={`group relative z-20 flex h-full cursor-pointer items-center justify-center bg-transparent border-none ${iconContainerClassName}`}
          onClick={() => handleItemClick(index, onClick)}
          aria-label={label}
          title={label}
          style={{ padding: '0 1.25rem' }}
        >
          {/* Floating Hover Tooltip */}
          {label && (
            <span
              className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-y-1 scale-90 group-hover:scale-100 z-50"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '0.375rem',
                background: '#1a1a1a',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {label}
              {/* Little arrow at bottom of tooltip */}
              <span
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderWidth: '4px',
                  borderStyle: 'solid',
                  borderColor: '#1a1a1a transparent transparent transparent',
                }}
              />
            </span>
          )}
          {cloneElement(icon, {
            className: `w-6 h-6 transition-opacity duration-100 ease-in-out ${
              activeIndex === index ? 'opacity-100' : 'opacity-40'
            } ${icon.props.className || ''} ${iconClassName || ''}`,
          })}
        </button>
      ))}

      <div 
        ref={limelightRef}
        className={`absolute top-0 z-10 w-11 h-[5px] rounded-full bg-primary shadow-[0_50px_15px_var(--primary)] ${
          isReady ? 'transition-[left] duration-400 ease-in-out' : ''
        } ${limelightClassName}`}
        style={{ left: '-999px' }}
      >
        <div className="absolute left-[-30%] top-[5px] w-[160%] h-14 [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)] bg-gradient-to-b from-primary/30 to-transparent pointer-events-none" />
      </div>
    </nav>
  );
};

export default LimelightNav;
