import { useEffect, useRef } from "react";
import { Game } from "@/game_components/game";
import { RoundState } from "../types";
import { DIAMOND_MAPPING } from "@/constants";

interface UseGamePlaybackProps {
  isPlaying: boolean;
  speed: number;
  maxRounds: number;
  mode: "game" | "simulation";
  currentRound: number;
  gameRef: React.RefObject<Game>;
  executeRound: (roundNumber: number, userChoice?: string) => RoundState;
  updateStateFromRoundState: (roundState: RoundState) => void;
  setRoundStates: React.Dispatch<React.SetStateAction<RoundState[]>>;
  setCurrentRound: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setDiamondChoice: (value: 0 | 1 | 2 | 3 | 4) => void;
  setPlayer1Score: (value: number) => void;
  setPlayer2Score: (value: number) => void;
}

/**
 * Hook to manage auto-playback functionality
 */
export function useGamePlayback({
  isPlaying,
  speed,
  maxRounds,
  mode,
  currentRound,
  gameRef,
  executeRound,
  updateStateFromRoundState,
  setRoundStates,
  setCurrentRound,
  setIsPlaying,
  setDiamondChoice,
  setPlayer1Score,
  setPlayer2Score
}: UseGamePlaybackProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (mode === "game") {
          setCurrentRound(prevRound => {
            if (prevRound >= maxRounds) {
              setIsPlaying(false);
              return prevRound;
            }
            const newRound = prevRound + 1;
            
            setRoundStates(prevStates => {
              const roundExists = prevStates.some(state => state.round === newRound);
              if (roundExists) return prevStates;
              
              const newRoundState = executeRound(newRound);
              updateStateFromRoundState(newRoundState);
              return [...prevStates, newRoundState];
            });
            
            return newRound;
          });
        } else {
          // Simulation mode
          setCurrentRound(prevRound => {
            if (prevRound >= maxRounds) {
              setIsPlaying(false);
              return prevRound;
            }
            const result = gameRef.current?.round(prevRound + 1);
            if (!result) return prevRound;
            
            const outcome = result.p1_choice + result.p2_choice;
            const diamondIndex = DIAMOND_MAPPING[outcome as keyof typeof DIAMOND_MAPPING] || 0;
            const newRound = prevRound + 1;
            const newPlayer1Score = gameRef.current?.players[0].getScore() || 0;
            const newPlayer2Score = gameRef.current?.players[1].getScore() || 0;
            
            const newRoundState: RoundState = {
              round: newRound,
              choice: diamondIndex as 0 | 1 | 2 | 3 | 4,
              p1Score: newPlayer1Score,
              p2Score: newPlayer2Score,
              result
            };
            
            setRoundStates(prevStates => [...prevStates, newRoundState]);
            setDiamondChoice(diamondIndex as 0 | 1 | 2 | 3 | 4);
            setPlayer1Score(newPlayer1Score);
            setPlayer2Score(newPlayer2Score);
            
            return newRound;
          });
        }
      }, speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed, maxRounds, mode, gameRef, executeRound, updateStateFromRoundState, setRoundStates, setCurrentRound, setIsPlaying, setDiamondChoice, setPlayer1Score, setPlayer2Score]);

  return intervalRef;
}

