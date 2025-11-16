import { useMemo } from "react";
import { WinnerInfo } from "../types";

/**
 * Hook to calculate winner information
 */
export function useWinner(
  showWinnerMessage: boolean,
  currentRound: number,
  maxRounds: number,
  player1Score: number,
  player2Score: number,
  roundStatesLength: number
) {
  const winnerMessage = useMemo(() => {
    if (!showWinnerMessage) return null;
    if (currentRound < maxRounds || roundStatesLength <= 1) return null;
    
    if (player1Score > player2Score) return "Player 1 Wins!";
    if (player2Score > player1Score) return "Player 2 Wins!";
    return "It's a Tie!";
  }, [showWinnerMessage, currentRound, maxRounds, player1Score, player2Score, roundStatesLength]);

  const winnerColor = useMemo(() => {
    if (winnerMessage === "It's a Tie!") return "bg-yellow-500";
    if (winnerMessage === "Player 1 Wins!") return "bg-blue-500";
    return "bg-purple-500";
  }, [winnerMessage]);

  const winnerInfo = useMemo((): WinnerInfo | null => {
    if (!showWinnerMessage) return null;
    if (currentRound < maxRounds || roundStatesLength <= 1) return null;
    if (player1Score > player2Score) return { winner: "Player 1", score: player1Score, isTie: false };
    if (player2Score > player1Score) return { winner: "Player 2", score: player2Score, isTie: false };
    return { winner: null, score: player1Score, isTie: true };
  }, [showWinnerMessage, currentRound, maxRounds, player1Score, player2Score, roundStatesLength]);

  return { winnerMessage, winnerColor, winnerInfo };
}

