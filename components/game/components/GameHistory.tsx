import { useState } from "react";
import { RoundState, WinnerInfo } from "../types";
import { formatAction } from "../utils";

interface GameHistoryProps {
  roundStates: RoundState[];
  maxRounds: number;
  getWinnerInfo: () => WinnerInfo | null;
}

export function GameHistory({ roundStates, maxRounds, getWinnerInfo }: GameHistoryProps) {
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);

  return (
    <div className="w-full max-w-4xl px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 mt-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-5 md:p-6">
        <button
          onClick={() => setIsHistoryVisible(!isHistoryVisible)}
          className="w-full flex items-center justify-between text-left cursor-pointer hover:opacity-80 transition-opacity mb-3 sm:mb-4"
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black">Game History</h2>
          <svg
            className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-600 transition-transform duration-200 ${
              isHistoryVisible ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isHistoryVisible && (
          <div className="space-y-2 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
            {roundStates.slice(1).map((roundState, index) => {
              const roundNum = roundState.round;
              const p1Action = formatAction(roundState.result.p1_choice);
              const p2Action = formatAction(roundState.result.p2_choice);
              const p1Points = roundState.result.scores[0];
              const p2Points = roundState.result.scores[1];
              const isFinalRound = roundNum === maxRounds;
              const winnerInfo = isFinalRound ? getWinnerInfo() : null;
              
              return (
                <div key={`round-${index}-${roundNum}`} className="text-xs sm:text-sm text-gray-700 pb-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    Round {roundNum}: P1 {p1Action}, P2 {p2Action}. P1 earns {p1Points} points, and P2 earns {p2Points} points.
                  </div>
                  {isFinalRound && winnerInfo && (
                    <div className="mt-2 font-bold text-base sm:text-lg">
                      {winnerInfo.isTie 
                        ? `It's a Tie! Both players have ${winnerInfo.score} points!`
                        : `${winnerInfo.winner} wins with ${winnerInfo.score} points!`
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

