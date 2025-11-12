import React from "react";
import "./diamond.css";

interface MiniProps {
    x: 0 | 1 | 2 | 3 | 4;
    score: string;
    diamondIndex: 1 | 2 | 3 | 4; // Which diamond this is (1=top, 2=left, 3=right, 4=bottom)
    positionStyle: React.CSSProperties;
}

const SCALE = 1.1;

const getDiamondClass = (diamondIndex: number, isSelected: boolean) => {
    if (!isSelected) return "unselected";
    
    switch (diamondIndex) {
        case 1: return "cooperation animate-pulse"; // CC - green
        case 2: return "defect-success animate-pulse"; // DC - yellow/warning
        case 3: return "defect-success animate-pulse"; // CD - yellow/warning
        case 4: return "defect animate-pulse"; // DD - red
        default: return "unselected";
    }
};

export default function Base({ x, score, diamondIndex, positionStyle }: MiniProps) {
    const isSelected = x === diamondIndex;
    const { transform: positionTransform, ...restPositionStyle } = positionStyle;
    const scaleTransform = `scale(${isSelected ? SCALE : 1})`;
    const combinedTransform = `${positionTransform || ''} rotate(45deg) ${scaleTransform}`.trim();
    
    return (
        <div
            className={`diamond-base ${getDiamondClass(diamondIndex, isSelected)}`}
            style={{
                width: 'clamp(4rem, 12.5vw, 6rem)',
                height: 'clamp(4rem, 12.5vw, 6rem)',
                transform: combinedTransform,
                transformOrigin: 'center',
                transition: 'background-color 0.5s ease-in-out, transform 0.3s ease-in-out',
                ...restPositionStyle,
            }}
        >
            <span
                className="text-black font-medium -rotate-45 transition-opacity duration-500"
                style={{
                    fontSize: 'clamp(0.75rem, 1.5vw, 1.25rem)',
                    opacity: isSelected ? 1 : 0.7,
                }}
            >
                {score}
            </span>
        </div>
    )
}