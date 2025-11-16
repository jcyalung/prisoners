import { RoundState } from "../types";
import { getClampedRound, speedToScale } from "../utils";

interface GameControlsProps {
  roundStates: RoundState[];
  maxRounds: number;
  currentRound: number;
  speed: number;
  speedScaleMax: number;
  speedScaleMin: number;
  mode: "game" | "simulation";
  isPlaying: boolean;
  showSelfPlayControls: boolean;
  player1Strategy: string;
  onSliderChange: (roundNumber: number) => void;
  onSpeedChange: (value: number) => void;
  onTogglePlayPause: () => void;
  onPlayNextRound: () => void;
  onReset: () => void;
  scaleToSpeed: (scale: number) => number;
}

export function GameControls({
  roundStates,
  maxRounds,
  currentRound,
  speed,
  speedScaleMax,
  speedScaleMin,
  mode,
  isPlaying,
  showSelfPlayControls,
  player1Strategy,
  onSliderChange,
  onSpeedChange,
  onTogglePlayPause,
  onPlayNextRound,
  onReset,
  scaleToSpeed
}: GameControlsProps) {
  const clampedRound = getClampedRound(currentRound, maxRounds);

  return (
    <>
      {/* Round Slider */}
      {roundStates.length > 1 && maxRounds > 0 && (
        <div className="w-full max-w-2xl px-4 sm:px-6 md:px-8 pb-3 sm:pb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Round: {clampedRound} / {maxRounds}
          </label>
          <input
            type="range"
            min="1"
            max={maxRounds}
            value={clampedRound}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: maxRounds > 1
                ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((clampedRound - 1) / (maxRounds - 1)) * 100}%, #e5e7eb ${((clampedRound - 1) / (maxRounds - 1)) * 100}%, #e5e7eb 100%)`
                : '#3b82f6'
            }}
          />
        </div>
      )}

      {/* Speed Slider */}
      <div className="w-full max-w-2xl px-4 sm:px-6 md:px-8 pb-3 sm:pb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          Speed: {speedToScale(speed, speedScaleMin, speedScaleMax)} / {speedScaleMax} ({speed === speedScaleMin && mode === "game" ? 'instant' : `${speed}ms`} per round)
        </label>
        <input
          type="range"
          min="1"
          max={speedScaleMax}
          value={speedToScale(speed, speedScaleMin, speedScaleMax)}
          onChange={(e) => onSpeedChange(scaleToSpeed(Number(e.target.value)))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${((speedToScale(speed, speedScaleMin, speedScaleMax) - 1) / (speedScaleMax - 1)) * 100}%, #e5e7eb ${((speedToScale(speed, speedScaleMin, speedScaleMax) - 1) / (speedScaleMax - 1)) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>
        
      {/* Buttons */}
      <div className="w-full flex justify-center gap-3 sm:gap-4 pb-4 sm:pb-6 md:pb-8 flex-wrap px-4">
        <button
          className={`btn px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded transition-colors font-semibold text-sm sm:text-base ${
            isPlaying 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
          onClick={onTogglePlayPause}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          className="btn btn-primary px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          onClick={onPlayNextRound}
          disabled={isPlaying || currentRound >= maxRounds || (showSelfPlayControls && player1Strategy === "SelfPlay")}
        >
          Next Round
        </button>
        <button
          className="btn px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-semibold text-sm sm:text-base"
          onClick={onReset}
          disabled={isPlaying}
        >
          Reset
        </button>
      </div>
    </>
  );
}

