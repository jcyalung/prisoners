
'use client';
import "./diamond.css";
import Base from "./base";
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

const DIAMOND_BORDER = "clamp(8rem, 25vw, 12rem)"
const CLAMP_STYLE = "clamp(-2rem, -2.5vw, -5rem)"
export default function Diamond({ x }: DiamondProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: DIAMOND_BORDER,
        height: DIAMOND_BORDER,
      }}
    >
      {/* Top diamond */}
      <Base 
        x={x} 
        score="3 | 3" 
        diamondIndex={1}
        positionStyle={{
          top: CLAMP_STYLE,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      
      {/* Left diamond */}
      <Base 
        x={x} 
        score="5 | 1" 
        diamondIndex={2}
        positionStyle={{
          left: CLAMP_STYLE,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
      
      {/* Right diamond */}
      <Base 
        x={x} 
        score="1 | 5" 
        diamondIndex={3}
        positionStyle={{
          right: CLAMP_STYLE,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
      
      {/* Bottom diamond */}
      <Base 
        x={x} 
        score="1 | 1" 
        diamondIndex={4}
        positionStyle={{
          bottom: CLAMP_STYLE,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
    </div>
  );
}

