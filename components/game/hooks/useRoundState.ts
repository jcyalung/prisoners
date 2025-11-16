import { useState } from "react";
import { RoundState } from "../types";
import { DIAMOND_MAPPING } from "@/constants";
import { Game } from "@/game_components/game";
import { createInitialRoundState } from "../utils";

/**
 * Hook to manage round state creation and updates
 */
export function useRoundState(gameRef: React.RefObject<Game>) {
  const [roundStates, setRoundStates] = useState<RoundState[]>([createInitialRoundState()]);

  const createRoundState = (
    roundNumber: number,
    result: {p1_choice: string, p2_choice: string, scores: number[]}
  ): RoundState => {
    const outcome = result.p1_choice + result.p2_choice;
    const diamondIndex = DIAMOND_MAPPING[outcome as keyof typeof DIAMOND_MAPPING] || 0;
    const newPlayer1Score = gameRef.current?.players[0].getScore() || 0;
    const newPlayer2Score = gameRef.current?.players[1].getScore() || 0;
    
    return {
      round: roundNumber,
      choice: diamondIndex as 0 | 1 | 2 | 3 | 4,
      p1Score: newPlayer1Score,
      p2Score: newPlayer2Score,
      result
    };
  };

  const updateStateFromRoundState = (
    roundState: RoundState,
    setters: {
      setDiamondChoice: (value: 0 | 1 | 2 | 3 | 4) => void;
      setPlayer1Score: (value: number) => void;
      setPlayer2Score: (value: number) => void;
      setCurrentRound: (value: number) => void;
    }
  ) => {
    setters.setDiamondChoice(roundState.choice);
    setters.setPlayer1Score(roundState.p1Score);
    setters.setPlayer2Score(roundState.p2Score);
    setters.setCurrentRound(roundState.round);
  };

  const resetRoundStates = () => {
    setRoundStates([createInitialRoundState()]);
  };

  return {
    roundStates,
    setRoundStates,
    createRoundState,
    updateStateFromRoundState,
    resetRoundStates
  };
}

