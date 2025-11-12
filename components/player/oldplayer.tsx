interface PlayerProps {
    playerNumber: 1 | 2;
    currentStrategy: string;
    availableStrategies: string[];
    onStrategyChange: (player: 1 | 2, strategyName: string) => void;
    getStrategyDisplayName: (strategyName: string) => string;
    color: "blue" | "purple";
  }
  
  export default function Player({
    playerNumber,
    currentStrategy,
    availableStrategies,
    onStrategyChange,
    getStrategyDisplayName,
    color
  }: PlayerProps) {
    const bgColor = color === "blue" ? "bg-blue-500" : "bg-purple-500";
    const ringClass = color === "blue" ? "ring-primary" : "ring-secondary";
  
    return (
      <div className="flex flex-col items-center">
        <div className="avatar">
          <div className={`w-16 rounded-full ring ${ringClass} ring-offset-base-100 ring-offset-2 ${bgColor} flex items-center justify-center`}>
            <span className="text-white font-bold">P{playerNumber}</span>
          </div>
        </div>
        <span className="mt-2 text-sm font-medium text-black">Player {playerNumber}</span>
        <span className="text-xs text-gray-600 mb-3">{getStrategyDisplayName(currentStrategy)}</span>
        <div className="flex flex-col gap-1 mt-1">
          {availableStrategies.map((strategyName) => (
            <button
              key={strategyName}
              onClick={() => onStrategyChange(playerNumber, strategyName)}
              className={`px-3 py-1 text-xs rounded transition-colors font-medium ${
                currentStrategy === strategyName
                  ? `${bgColor} text-white`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getStrategyDisplayName(strategyName)}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  