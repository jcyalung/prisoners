"use client";

import { useState, useEffect } from "react";
import CodeEditor from "@/components/code-editor";
import StrategyDropdown from "./strategy-dropdown";

interface PlayerProps {
  number: 1 | 2;  
  strategy: string;  
  available: string[];  
  onStrategyChange: (player: 1 | 2, strategyName: string) => void;  
  getStrategyDisplayName: (strategyName: string) => string; 
  color: "blue" | "purple";  
  onSaveCustomCode?: (code: string) => void;  
}

export default function Player({
  number,
  strategy,
  available,
  onStrategyChange,
  getStrategyDisplayName,
  color,
  onSaveCustomCode
}: PlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bgColor = color === "blue" ? "bg-blue-500" : "bg-purple-500";
  const ringClass = color === "blue" ? "ring-primary" : "ring-secondary";

  useEffect(() => {
    if (strategy !== "Custom") {
      setIsOpen(false);
    }
  }, [strategy]);

  const handleStrategy = (name: string) => {
    if (name === "Custom") { setIsOpen(true); }
    onStrategyChange(number, name);
  };

  const handleSave = (code: string) => { if (onSaveCustomCode) { onSaveCustomCode(code); } };

  const handleClose = () => { setIsOpen(false); };

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      {/* player */}
      <div className="avatar">
        <div className={`w-16 rounded-full ring ${ringClass} ring-offset-base-100 ring-offset-2 ${bgColor} flex items-center justify-center`}>
          <span className="text-white font-bold">P{number}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-black">Player {number}</span>


      {/* dropdown strategy */}
      <div className="mt-2 w-full max-w-full">
        <StrategyDropdown
          currentStrategy={strategy}
          availableStrategies={Array.isArray(available) ? available : ["AlwaysCooperate"]}
          onStrategyChange={handleStrategy}
          getStrategyDisplayName={getStrategyDisplayName}
          color={color}
        />
      </div>
      
      {strategy === "Custom" && (
        <>
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium text-sm"
            >
              Edit Custom Strategy
            </button>
          )}
          {isOpen && (
            <div className="mt-4 w-full">
              <CodeEditor
                isOpen={isOpen}
                onClose={handleClose}
                onSave={handleSave}
                compact={true}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

