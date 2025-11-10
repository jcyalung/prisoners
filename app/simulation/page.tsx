"use client";
import Diamond from "@/components/diamond";
import { useState, useRef, useEffect } from "react";
import { Game } from "@/game_components/game";
import { AlwaysCooperate } from "@/game_components/strategies/alwayscooperate";
import { DIAMOND_MAPPING } from "@/constants";

interface RoundState {
    round: number;
    diamondChoice: 0 | 1 | 2 | 3 | 4;
    player1Score: number;
    player2Score: number;
    result: {p1_choice: string, p2_choice: string, scores: number[]};
}

export default function SimulationPage() {
    const [currentRound, setCurrentRound] = useState(0);
    const [diamondChoice, setDiamondChoice] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [player1Score, setPlayer1Score] = useState(0);
    const [player2Score, setPlayer2Score] = useState(0);
    const [roundStates, setRoundStates] = useState<RoundState[]>([{
        round: 0,
        diamondChoice: 0,
        player1Score: 0,
        player2Score: 0,
        result: {p1_choice: "", p2_choice: "", scores: [0, 0]}
    }]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1000); // milliseconds between rounds
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const gameRef = useRef<Game>(
        new Game([new AlwaysCooperate("Player 1", 0, []), new AlwaysCooperate("Player 2", 0, [])])
    );

    const playNextRound = () => {
        const result = gameRef.current.round(currentRound + 1);
        const outcome = result.p1_choice + result.p2_choice;
        const diamondIndex = DIAMOND_MAPPING[outcome as keyof typeof DIAMOND_MAPPING] || 0;
        const newRound = currentRound + 1;
        const newPlayer1Score = gameRef.current.players[0].getScore();
        const newPlayer2Score = gameRef.current.players[1].getScore();
        
        const newRoundState: RoundState = {
            round: newRound,
            diamondChoice: diamondIndex as 0 | 1 | 2 | 3 | 4,
            player1Score: newPlayer1Score,
            player2Score: newPlayer2Score,
            result
        };
        
        setRoundStates([...roundStates, newRoundState]);
        setDiamondChoice(diamondIndex as 0 | 1 | 2 | 3 | 4);
        setPlayer1Score(newPlayer1Score);
        setPlayer2Score(newPlayer2Score);
        setCurrentRound(newRound);
    };

    const handleSliderChange = (value: number) => {
        const roundState = roundStates[value];
        if (roundState) {
            setCurrentRound(roundState.round);
            setDiamondChoice(roundState.diamondChoice);
            setPlayer1Score(roundState.player1Score);
            setPlayer2Score(roundState.player2Score);
        }
    };

    // Auto-play effect
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                // Use functional updates to access latest state
                setCurrentRound(prevRound => {
                    const result = gameRef.current.round(prevRound + 1);
                    const outcome = result.p1_choice + result.p2_choice;
                    const diamondIndex = DIAMOND_MAPPING[outcome as keyof typeof DIAMOND_MAPPING] || 0;
                    const newRound = prevRound + 1;
                    const newPlayer1Score = gameRef.current.players[0].getScore();
                    const newPlayer2Score = gameRef.current.players[1].getScore();
                    
                    const newRoundState: RoundState = {
                        round: newRound,
                        diamondChoice: diamondIndex as 0 | 1 | 2 | 3 | 4,
                        player1Score: newPlayer1Score,
                        player2Score: newPlayer2Score,
                        result
                    };
                    
                    setRoundStates(prevStates => [...prevStates, newRoundState]);
                    setDiamondChoice(diamondIndex as 0 | 1 | 2 | 3 | 4);
                    setPlayer1Score(newPlayer1Score);
                    setPlayer2Score(newPlayer2Score);
                    
                    return newRound;
                });
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
    }, [isPlaying, speed]);

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSpeedChange = (value: number) => {
        setSpeed(value);
    };

    // Convert speed (ms) to a more intuitive scale (1-10, where 1 is slowest, 10 is fastest)
    const speedToScale = (ms: number) => {
        // Speed range: 100ms (fastest) to 3000ms (slowest)
        // Scale: 10 (fastest) to 1 (slowest)
        return Math.round(((3000 - ms) / 2900) * 9 + 1);
    };

    const scaleToSpeed = (scale: number) => {
        // Scale: 1 (slowest) to 10 (fastest)
        // Speed range: 3000ms (slowest) to 100ms (fastest)
        return Math.round(3000 - ((scale - 1) / 9) * 2900);
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
        {/* Top container */}
        <div className="w-full flex flex-col items-center pt-8 pb-8">
          <h1 className="text-2xl font-bold text-black">Prisoner's Dilemma Simulation</h1>
          <div className="mt-2 text-center">
            <div className="text-lg font-semibold text-black">Round: {currentRound}</div>
            <div className="text-md text-black mt-2">Player 1: {player1Score} | Player 2: {player2Score}</div>
            {currentRound > 0 && roundStates[currentRound] && (
              <div className="text-sm text-gray-600 mt-1">
                Round {currentRound}: {roundStates[currentRound].result.p1_choice} vs {roundStates[currentRound].result.p2_choice}
              </div>
            )}
          </div>
        </div>
          
        {/* 3-column layout */}
        <div className="grid grid-cols-3 items-center justify-items-center w-full flex-1 px-4 gap-4">
          {/* Left player */}
          <div className="flex flex-col items-center">
            <div className="avatar">
              <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">P1</span>
              </div>
            </div>
            <span className="mt-2 text-sm font-medium text-black">Player 1</span>
            <span className="text-xs text-gray-600">AlwaysCooperate</span>
          </div>
          
          {/* Diamond in the center */}
          <div className="flex justify-center items-center">
            <Diamond x={diamondChoice} />
          </div>
          
          {/* Right player */}
          <div className="flex flex-col items-center">
            <div className="avatar">
              <div className="w-16 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2 bg-purple-500 flex items-center justify-center">
                <span className="text-white font-bold">P2</span>
              </div>
            </div>
            <span className="mt-2 text-sm font-medium text-black">Player 2</span>
            <span className="text-xs text-gray-600">AlwaysCooperate</span>
          </div>
        </div>
          
        {/* Round Slider */}
        {roundStates.length > 1 && (
          <div className="w-full max-w-2xl px-8 pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Round: {currentRound} / {roundStates.length - 1}
            </label>
            <input
              type="range"
              min="0"
              max={roundStates.length - 1}
              value={currentRound}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: roundStates.length > 1 
                  ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentRound / (roundStates.length - 1)) * 100}%, #e5e7eb ${(currentRound / (roundStates.length - 1)) * 100}%, #e5e7eb 100%)`
                  : '#e5e7eb'
              }}
            />
          </div>
        )}

        {/* Speed Slider */}
        <div className="w-full max-w-2xl px-8 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speed: {speedToScale(speed)} / 10 ({speed}ms per round)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={speedToScale(speed)}
            onChange={(e) => handleSpeedChange(scaleToSpeed(Number(e.target.value)))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${((speedToScale(speed) - 1) / 9) * 100}%, #e5e7eb ${((speedToScale(speed) - 1) / 9) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
          
        {/* Buttons */}
        <div className="w-full flex justify-center gap-4 pb-8 flex-wrap">
          <button
            className={`btn px-6 py-3 rounded transition-colors font-semibold ${
              isPlaying 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            onClick={togglePlayPause}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            className="btn btn-primary px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-semibold"
            onClick={playNextRound}
            disabled={isPlaying}
          >
            Next Round
          </button>
        </div>
      </div>
    );
}

