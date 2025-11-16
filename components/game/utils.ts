import { COOPERATE } from "@/constants";
import { RoundState } from "./types";

/**
 * Convert speed from milliseconds to a scale number (like 1-20)
 */
export const speedToScale = (ms: number, speedScaleMin: number, speedScaleMax: number): number => {
  const range = 3000 - speedScaleMin;
  const scaleRange = speedScaleMax - 1;
  return Math.round(((3000 - ms) / range) * scaleRange + 1);
};

/**
 * Convert scale number back to milliseconds
 */
export const scaleToSpeed = (scale: number, speedScaleMin: number, speedScaleMax: number): number => {
  const range = 3000 - speedScaleMin;
  const scaleRange = speedScaleMax - 1;
  return Math.round(3000 - ((scale - 1) / scaleRange) * range);
};

/**
 * Format strategy names for display (e.g., "TitForTat" -> "Tit For Tat")
 */
export const getStrategyDisplayName = (strategyName: string): string => {
  return strategyName.replace(/([A-Z])/g, ' $1').trim();
};

/**
 * Format action codes to full words
 */
export const formatAction = (action: string): string => {
  return action === COOPERATE ? "Cooperate" : "Defect";
};

/**
 * Clamp round number between 1 and maxRounds
 */
export const getClampedRound = (currentRound: number, maxRounds: number): number => {
  return Math.max(1, Math.min(currentRound, maxRounds));
};

/**
 * Get display title based on mode
 */
export const getDisplayTitle = (title: string | undefined, mode: "game" | "simulation"): string => {
  return title || (mode === "game" ? "Prisoner's Dilemma" : "Prisoner's Dilemma Simulation");
};

/**
 * Create initial round state
 */
export const createInitialRoundState = (): RoundState => {
  return {
    round: 0,
    choice: 0,
    p1Score: 0,
    p2Score: 0,
    result: {p1_choice: "", p2_choice: "", scores: [0, 0]}
  };
};

