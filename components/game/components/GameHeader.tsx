import { RoundState } from "../types";

interface GameHeaderProps {
  title: string;
  currentRound: number;
  maxRounds: number;
  maxRoundsLimit: number;
  player1Score: number;
  player2Score: number;
  roundStates: RoundState[];
  mode: "game" | "simulation";
  onMaxRoundsChange: (value: number) => void;
}

export function GameHeader({
  title,
  currentRound,
  maxRounds,
  maxRoundsLimit,
  player1Score,
  player2Score,
  roundStates,
  mode,
  onMaxRoundsChange
}: GameHeaderProps) {
  return (
    <div className="w-full flex flex-col items-center pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">{title}</h1>
      <div className="mt-2 text-center">
        <div className="text-base sm:text-lg md:text-xl font-semibold text-black flex items-center justify-center gap-2 flex-wrap">
          <span>Round: {currentRound} of</span>
          <input
            type="number"
            min="1"
            max={maxRoundsLimit}
            value={maxRounds}
            onChange={(e) => {
              const value = Math.max(1, Math.min(maxRoundsLimit, Number(e.target.value) || 1));
              onMaxRoundsChange(value);
            }}
            className={`${mode === "game" ? "w-20 sm:w-24 md:w-28" : "w-16 sm:w-20 md:w-20"} px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm sm:text-base`}
          />
        </div>
        <div className="text-sm sm:text-base md:text-lg text-black mt-2">
          Player 1: {player1Score} | Player 2: {player2Score}
        </div>
        {currentRound > 0 && roundStates[currentRound] && (
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            Round {currentRound}: {roundStates[currentRound].result.p1_choice} vs {roundStates[currentRound].result.p2_choice}
          </div>
        )}
      </div>
    </div>
  );
}

