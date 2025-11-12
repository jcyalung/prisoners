"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";

interface StrategyDropdownProps {
  currentStrategy: string;
  availableStrategies: string[];
  onStrategyChange: (strategyName: string) => void;
  getStrategyDisplayName: (strategyName: string) => string;
  color: "blue" | "purple";
}

export default function StrategyDropdown({
  currentStrategy,
  availableStrategies,
  onStrategyChange,
  getStrategyDisplayName,
  color
}: StrategyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState<number>(0);
  const [dropdownPosition, setDropdownPosition] = useState<"below" | "above">("below");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const borderColor = color === "blue" ? "border-blue-500" : "border-purple-500";
  const focusBorderColor = color === "blue" ? "focus:border-blue-600" : "focus:border-purple-600";

  // Group strategies
  const playerInteractiveStrategies = availableStrategies.filter(s => s === "Custom" || s === "SelfPlay");
  const computerStrategies = availableStrategies.filter(s => s !== "Custom" && s !== "SelfPlay");

  // Measure and set dropdown width to match button width
  const updateDropdownWidth = () => {
    if (buttonRef.current) {
      // Use offsetWidth for more reliable measurement including padding/borders
      const buttonWidth = buttonRef.current.offsetWidth;
      setDropdownWidth(buttonWidth);
    }
  };

  // Calculate dropdown position to prevent going off-screen
  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current || !menuRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight || 400; // Use maxHeight as estimate
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // If not enough space below but enough above, flip upward
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      setDropdownPosition("above");
    } else {
      setDropdownPosition("below");
    }
  }, []);

  // Use useLayoutEffect to measure width synchronously before paint
  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      // Measure immediately and also after a microtask to catch any layout changes
      updateDropdownWidth();
      requestAnimationFrame(() => {
        updateDropdownWidth();
        // Calculate position after menu is rendered
        setTimeout(() => {
          calculateDropdownPosition();
        }, 0);
      });
    }
  }, [isOpen]);

  // Recalculate position when menu is rendered
  useEffect(() => {
    if (isOpen && menuRef.current) {
      calculateDropdownPosition();
    }
  }, [isOpen, calculateDropdownPosition]);

  // Update width on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        updateDropdownWidth();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (strategyName: string) => {
    onStrategyChange(strategyName);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      // Measure button width immediately before opening
      const buttonWidth = buttonRef.current.offsetWidth;
      setDropdownWidth(buttonWidth);
    }
    setIsOpen(prev => !prev);
  };

  return (
    <div
      className="relative flex justify-center items-center"
      ref={dropdownRef}
      style={{
        width: "100%",
        minWidth: "220px",
        maxWidth: "100vw",
      }}
    >
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full px-3 py-2 text-xs rounded border-2 transition-colors font-medium ${borderColor} ${focusBorderColor} focus:outline-none bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-between`}
        style={{
          boxSizing: "border-box",
          minWidth: "220px",
          maxWidth: "100%",
        }}
      >
        <span className="flex-1 text-left overflow-hidden text-ellipsis whitespace-nowrap">
          {getStrategyDisplayName(currentStrategy)}
        </span>
        <svg
          className={`w-4 h-4 transition-transform shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute z-50 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden ${
            dropdownPosition === "above" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          style={{
            width: dropdownWidth || "100%",
            minWidth: "220px",
            maxWidth: "100%",
            maxHeight: "400px",
            boxSizing: "border-box",
          }}
        >
          {/* Scrollable Content Container */}
          <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: "400px" }}>

            {/* Player-Interactive Group */}
            {playerInteractiveStrategies.length > 0 && (
              <div className="py-2">
                <h2 className="text-xs font-semibold text-gray-700 px-4 py-1 text-left truncate">
                  Player-Interactive
                </h2>
                <div className="space-y-0">
                  {playerInteractiveStrategies.map((strategyName) => (
                    <button
                      key={strategyName}
                      type="button"
                      onClick={() => handleSelect(strategyName)}
                      className={`w-full text-left px-6 py-2 text-xs hover:bg-gray-100 transition-colors ${
                        currentStrategy === strategyName
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700"
                      }`}
                      title={getStrategyDisplayName(strategyName)}
                      style={{
                        minWidth: "220px",
                        maxWidth: "100%",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <span className="block truncate">
                        - {getStrategyDisplayName(strategyName)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Computer Group */}
            {computerStrategies.length > 0 && (
              <div className="py-2 border-t border-gray-200">
                <h2 className="text-xs font-semibold text-gray-700 px-4 py-1 text-left truncate">
                  Computer
                </h2>
                <div className="space-y-0">
                  {computerStrategies.map((strategyName) => (
                    <button
                      key={strategyName}
                      type="button"
                      onClick={() => handleSelect(strategyName)}
                      className={`w-full text-left px-6 py-2 text-xs hover:bg-gray-100 transition-colors ${
                        currentStrategy === strategyName
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700"
                      }`}
                      title={getStrategyDisplayName(strategyName)}
                      style={{
                        minWidth: "220px",
                        maxWidth: "100%",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <span className="block truncate">
                        - {getStrategyDisplayName(strategyName)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

