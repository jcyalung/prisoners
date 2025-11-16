import Diamond from "@/components/diamond/diamond";
import Player from "@/components/player/player";
import StrategyDropdown from "@/components/player/strategy-dropdown";
import { COOPERATE, DEFECT } from "@/constants";

interface GamePlayersProps {
  mode: "game" | "simulation";
  diamondChoice: 0 | 1 | 2 | 3 | 4;
  player1Strategy: string;
  player2Strategy: string;
  p1Strategies: string[];
  p2Strategies: string[];
  showSelfPlayControls: boolean;
  allowCustomStrategy: boolean;
  isPlaying: boolean;
  currentRound: number;
  maxRounds: number;
  onStrategyChange: (player: 1 | 2, strategyName: string) => void;
  onSaveCustomCode?: (player: 1 | 2, code: string) => void;
  onPlayNextRound: (userChoice?: string) => void;
  getStrategyDisplayName: (strategyName: string) => string;
}

export function GamePlayers({
  mode,
  diamondChoice,
  player1Strategy,
  player2Strategy,
  p1Strategies = [],
  p2Strategies = [],
  showSelfPlayControls,
  allowCustomStrategy,
  isPlaying,
  currentRound,
  maxRounds,
  onStrategyChange,
  onSaveCustomCode,
  onPlayNextRound,
  getStrategyDisplayName
}: GamePlayersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-items-center w-full px-2 sm:px-4 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8 mt-8 sm:mt-12 md:mt-16">
      {/* Left player */}
      <div className="flex flex-col items-center">
        {mode === "game" ? (
          <>
            <Player
              number={1}
              strategy={player1Strategy}
              available={p1Strategies}
              onStrategyChange={onStrategyChange}
              getStrategyDisplayName={getStrategyDisplayName}
              color="blue"
              onSaveCustomCode={allowCustomStrategy ? (code) => onSaveCustomCode?.(1, code) : undefined}
            />
            {showSelfPlayControls && player1Strategy === "SelfPlay" && !isPlaying && currentRound < maxRounds && (
              <div className="flex flex-col gap-2 mt-4">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-semibold"
                  onClick={() => onPlayNextRound(COOPERATE)}
                >
                  Cooperate
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold"
                  onClick={() => onPlayNextRound(DEFECT)}
                >
                  Defect
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm">
            <div className="avatar">
              <div className="w-12 sm:w-14 md:w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm md:text-base">P1</span>
              </div>
            </div>
            <span className="mt-2 text-xs sm:text-sm font-medium text-black">Player 1</span>
            <div className="mt-2 w-full max-w-full">
              <StrategyDropdown
                currentStrategy={player1Strategy}
                availableStrategies={p1Strategies}
                onStrategyChange={(strategyName) => onStrategyChange(1, strategyName)}
                getStrategyDisplayName={getStrategyDisplayName}
                color="blue"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Diamond in the center */}
      <div className="flex justify-center items-center py-8 sm:py-12 md:py-16">
        <Diamond x={diamondChoice} />
      </div>
      
      {/* Right player */}
      <div className="flex flex-col items-center">
        {mode === "game" ? (
          <Player
            number={2}
            strategy={player2Strategy}
            available={p2Strategies}
            onStrategyChange={onStrategyChange}
            getStrategyDisplayName={getStrategyDisplayName}
            color="purple"
            onSaveCustomCode={allowCustomStrategy ? (code) => onSaveCustomCode?.(2, code) : undefined}
          />
        ) : (
          <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm">
            <div className="avatar">
              <div className="w-12 sm:w-14 md:w-16 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2 bg-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm md:text-base">P2</span>
              </div>
            </div>
            <span className="mt-2 text-xs sm:text-sm font-medium text-black">Player 2</span>
            <div className="mt-2 w-full max-w-full">
              <StrategyDropdown
                currentStrategy={player2Strategy}
                availableStrategies={p2Strategies}
                onStrategyChange={(strategyName) => onStrategyChange(2, strategyName)}
                getStrategyDisplayName={getStrategyDisplayName}
                color="purple"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

