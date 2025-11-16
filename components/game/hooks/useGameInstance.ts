import { useRef } from "react";
import { Game } from "@/game_components/game";
import { AlwaysCooperate } from "@/game_components/strategies/alwayscooperate";
import Strategies from "@/game_components/strategies";

/**
 * Hook to create and manage game instance
 */
export function useGameInstance(p1Strategy: string, p2Strategy: string) {
  const createGame = (p1Strategy: string, p2Strategy: string): Game => {
    const Strategy1 = Strategies[p1Strategy];
    const Strategy2 = Strategies[p2Strategy];
    if (Strategy1 && Strategy2) {
      const player1 = new Strategy1("Player 1", 0, []);
      const player2 = new Strategy2("Player 2", 0, []);
      return new Game([player1, player2]);
    }
    return new Game([
      new AlwaysCooperate("Player 1", 0, []),
      new AlwaysCooperate("Player 2", 0, [])
    ]);
  };

  const gameRef = useRef<Game>(createGame(p1Strategy, p2Strategy));

  const recreateGame = (p1Strategy: string, p2Strategy: string) => {
    gameRef.current = createGame(p1Strategy, p2Strategy);
  };

  return { gameRef, recreateGame };
}

