"use client";

import { useState, useEffect } from "react";
import CodeEditor from "@/components/code-editor";
import StrategyDropdown from "./strategy-dropdown";

interface PlayerProps {
  playerNumber: 1 | 2;
  currentStrategy: string;
  availableStrategies: string[];
  onStrategyChange: (player: 1 | 2, strategyName: string) => void;
  getStrategyDisplayName: (strategyName: string) => string;
  color: "blue" | "purple";
  onSaveCustomCode?: (code: string) => void;
}

export default function Player({
  playerNumber,
  currentStrategy,
  availableStrategies,
  onStrategyChange,
  getStrategyDisplayName,
  color,
  onSaveCustomCode
}: PlayerProps) {
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const bgColor = color === "blue" ? "bg-blue-500" : "bg-purple-500";
  const ringClass = color === "blue" ? "ring-primary" : "ring-secondary";

  // Reset editor state when switching away from Custom
  useEffect(() => {
    if (currentStrategy !== "Custom") {
      setIsCodeEditorOpen(false);
    }
  }, [currentStrategy]);

  const handleStrategyClick = (strategyName: string) => {
    if (strategyName === "Custom") {
      setIsCodeEditorOpen(true);
    }
    onStrategyChange(playerNumber, strategyName);
  };

  const handleSave = (code: string) => {
    if (onSaveCustomCode) {
      onSaveCustomCode(code);
    }
    // Keep editor open for continued editing
  };

  const handleCloseEditor = () => {
    setIsCodeEditorOpen(false);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <div className="avatar">
        <div className={`w-16 rounded-full ring ${ringClass} ring-offset-base-100 ring-offset-2 ${bgColor} flex items-center justify-center`}>
          <span className="text-white font-bold">P{playerNumber}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-black">Player {playerNumber}</span>
      <div className="mt-2 w-full max-w-full">
        <StrategyDropdown
          currentStrategy={currentStrategy}
          availableStrategies={availableStrategies}
          onStrategyChange={handleStrategyClick}
          getStrategyDisplayName={getStrategyDisplayName}
          color={color}
        />
      </div>
      
      {/* Inline Code Editor when Custom is selected */}
      {currentStrategy === "Custom" && isCodeEditorOpen && (
        <div className="mt-4 w-full">
          <CodeEditor
            isOpen={isCodeEditorOpen}
            onClose={handleCloseEditor}
            onSave={handleSave}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}

