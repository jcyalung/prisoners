import { useMemo } from "react";
import Strategies from "@/game_components/strategies";

/**
 * Hook to manage available strategies for each player
 */
export function useGameStrategies(
  mode: "game" | "simulation",
  player1StrategiesFilter?: (strategies: string[]) => string[],
  player2StrategiesFilter?: (strategies: string[]) => string[]
) {
  const allStrategies = useMemo(() => {
    try {
      const strategies = Object.keys(Strategies || {}).filter(
        key => key !== "default" && typeof Strategies[key] === "function"
      );
      return strategies.length > 0 ? strategies : ["AlwaysCooperate"];
    } catch (error) {
      console.error("Error loading strategies:", error);
      return ["AlwaysCooperate"];
    }
  }, []);

  const p1Strategies = useMemo(() => {
    if (!Array.isArray(allStrategies) || allStrategies.length === 0) {
      return ["AlwaysCooperate"];
    }
    if (player1StrategiesFilter) {
      const filtered = player1StrategiesFilter(allStrategies);
      return Array.isArray(filtered) ? filtered : allStrategies;
    }
    // Default: Player 1 gets all strategies in game mode
    return mode === "game" ? allStrategies : allStrategies;
  }, [allStrategies, mode, player1StrategiesFilter]);

  const p2Strategies = useMemo(() => {
    if (!Array.isArray(allStrategies) || allStrategies.length === 0) {
      return ["AlwaysCooperate"];
    }
    if (player2StrategiesFilter) {
      const filtered = player2StrategiesFilter(allStrategies);
      return Array.isArray(filtered) ? filtered : allStrategies.filter(s => s !== "SelfPlay" && s !== "Custom");
    }
    // Default: Player 2 filters out SelfPlay and Custom in game mode
    return mode === "game"
      ? allStrategies.filter(strategy => strategy !== "SelfPlay" && strategy !== "Custom")
      : allStrategies;
  }, [allStrategies, mode, player2StrategiesFilter]);

  // Ensure we always return arrays
  return { 
    allStrategies: Array.isArray(allStrategies) ? allStrategies : ["AlwaysCooperate"], 
    p1Strategies: Array.isArray(p1Strategies) ? p1Strategies : ["AlwaysCooperate"], 
    p2Strategies: Array.isArray(p2Strategies) ? p2Strategies : ["AlwaysCooperate"]
  };
}

