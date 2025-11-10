'use client';

/**
 * 0: no diamonds
 * 1: top diamond
 * 2: left diamond
 * 3: right diamond
 * 4: bottom diamond
 */
interface DiamondProps {
  x: 0 | 1 | 2 | 3 | 4;
}

const TEXT_FONT_SIZE = 'clamp(0.75rem, 1.5vw, 1.25rem)';

export default function Diamond({ x }: DiamondProps) {
  const baseClasses = 'absolute border-2 border-black flex items-center justify-center transition-all duration-500 ease-in-out';
  const cooperation = 'bg-green-500';
  const successfulDefect = 'bg-warning';
  const defected = 'bg-white';
  
  // Animation classes for active diamonds
  const pulseAnimation = 'animate-pulse';
  const scale = x === 1 || x === 2 || x === 3 || x === 4 ? 1.1 : 1;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: 'clamp(8rem, 25vw, 12rem)',
        height: 'clamp(8rem, 25vw, 12rem)',
      }}
    >
      {/* Top diamond */}
      <div
        className={`${baseClasses} ${x === 1 ? `${cooperation} ${pulseAnimation}` : defected} left-1/2`}
        style={{
          width: 'clamp(4rem, 12.5vw, 6rem)',
          height: 'clamp(4rem, 12.5vw, 6rem)',
          top: 'clamp(-2rem, -2.5vw, -3rem)',
          transform: `translateX(-50%) rotate(45deg) scale(${x === 1 ? scale : 1})`,
          transformOrigin: 'center',
          transition: 'background-color 0.5s ease-in-out, transform 0.3s ease-in-out',
        }}
      >
        <span
          className="text-black font-medium -rotate-45 transition-opacity duration-500"
          style={{
            fontSize: TEXT_FONT_SIZE,
            opacity: x === 1 ? 1 : 0.7,
          }}
        >
          3 | 3
        </span>
      </div>
      
      {/* Left diamond */}
      <div
        className={`${baseClasses} ${x === 2 ? `${successfulDefect} ${pulseAnimation}` : defected} top-1/2`}
        style={{
          width: 'clamp(4rem, 12.5vw, 6rem)',
          height: 'clamp(4rem, 12.5vw, 6rem)',
          left: 'clamp(-2rem, -2.5vw, -3rem)',
          transform: `translateY(-50%) rotate(45deg) scale(${x === 2 ? scale : 1})`,
          transformOrigin: 'center',
          transition: 'background-color 0.5s ease-in-out, transform 0.3s ease-in-out',
        }}
      >
        <span
          className="text-black font-medium -rotate-45 transition-opacity duration-500"
          style={{
            fontSize: TEXT_FONT_SIZE,
            opacity: x === 2 ? 1 : 0.7,
          }}
        >
          5 | 1
        </span>
      </div>
      
      {/* Right diamond */}
      <div
        className={`${baseClasses} ${x === 3 ? `${successfulDefect} ${pulseAnimation}` : defected} top-1/2`}
        style={{
          width: 'clamp(4rem, 12.5vw, 6rem)',
          height: 'clamp(4rem, 12.5vw, 6rem)',
          right: 'clamp(-2rem, -2.5vw, -3rem)',
          transform: `translateY(-50%) rotate(45deg) scale(${x === 3 ? scale : 1})`,
          transformOrigin: 'center',
          transition: 'background-color 0.5s ease-in-out, transform 0.3s ease-in-out',
        }}
      >
        <span
          className="text-black font-medium -rotate-45 transition-opacity duration-500"
          style={{
            fontSize: TEXT_FONT_SIZE,
            opacity: x === 3 ? 1 : 0.7,
          }}
        >
          1 | 5
        </span>
      </div>
      
      {/* Bottom diamond */}
      <div
        className={`${baseClasses} ${x === 4 ? `${cooperation} ${pulseAnimation}` : defected} left-1/2`}
        style={{
          width: 'clamp(4rem, 12.5vw, 6rem)',
          height: 'clamp(4rem, 12.5vw, 6rem)',
          bottom: 'clamp(-2rem, -2.5vw, -3rem)',
          transform: `translateX(-50%) rotate(45deg) scale(${x === 4 ? scale : 1})`,
          transformOrigin: 'center',
          transition: 'background-color 0.5s ease-in-out, transform 0.3s ease-in-out',
        }}
      >
        <span
          className="text-black font-medium -rotate-45 transition-opacity duration-500"
          style={{
            fontSize: TEXT_FONT_SIZE,
            opacity: x === 4 ? 1 : 0.7,
          }}
        >
          1 | 1
        </span>
      </div>
    </div>
  );
}

