"use client";
import Diamond from "@/components/diamond/diamond";
import { useState, useRef, useEffect } from "react";
import { Game } from "@/game_components/game";
import { AlwaysCooperate } from "@/game_components/strategies/alwayscooperate";
import { DIAMOND_MAPPING } from "@/constants";
import Strategies from "@/game_components/strategies";

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
    const [maxRounds, setMaxRounds] = useState(10);
    const [player1Strategy, setPlayer1Strategy] = useState<string>("AlwaysCooperate");
    const [player2Strategy, setPlayer2Strategy] = useState<string>("AlwaysCooperate");
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Get available strategy names
    const availableStrategies = Object.keys(Strategies).filter(key => 
        key !== "default" && typeof Strategies[key] === "function"
    );
    
    // Create a new game instance with current strategies
    const createGame = (p1Strategy: string, p2Strategy: string) => {
        const Strategy1 = Strategies[p1Strategy];
        const Strategy2 = Strategies[p2Strategy];
        if (Strategy1 && Strategy2) {
            return new Game([
                new Strategy1("Player 1", 0, []),
                new Strategy2("Player 2", 0, [])
            ]);
        }
        return new Game([new AlwaysCooperate("Player 1", 0, []), new AlwaysCooperate("Player 2", 0, [])]);
    };
    
    const gameRef = useRef<Game>(createGame(player1Strategy, player2Strategy));

    const playNextRound = () => {
        if (currentRound >= maxRounds) return;
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

    const handleSliderChange = (roundNumber: number) => {
        // Find the roundState that matches this round number
        const roundState = roundStates.find(state => state.round === roundNumber);
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
                    if (prevRound >= maxRounds) {
                        setIsPlaying(false);
                        return prevRound;
                    }
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
    }, [isPlaying, speed, maxRounds]);

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

    const handleStrategyChange = (player: 1 | 2, strategyName: string) => {
        if (player === 1) {
            setPlayer1Strategy(strategyName);
        } else {
            setPlayer2Strategy(strategyName);
        }
        // Reset game state when strategy changes
        const newP1Strategy = player === 1 ? strategyName : player1Strategy;
        const newP2Strategy = player === 2 ? strategyName : player2Strategy;
        gameRef.current = createGame(newP1Strategy, newP2Strategy);
        setCurrentRound(0);
        setDiamondChoice(0);
        setPlayer1Score(0);
        setPlayer2Score(0);
        setRoundStates([{
            round: 0,
            diamondChoice: 0,
            player1Score: 0,
            player2Score: 0,
            result: {p1_choice: "", p2_choice: "", scores: [0, 0]}
        }]);
        setIsPlaying(false);
    };

    const getStrategyDisplayName = (strategyName: string) => {
        // Convert camelCase to Title Case with spaces
        return strategyName.replace(/([A-Z])/g, ' $1').trim();
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
        {/* Top container */}
        <div className="w-full flex flex-col items-center pt-8 pb-8">
          <h1 className="text-2xl font-bold text-black">Prisoner's Dilemma Simulation</h1>
          <div className="mt-2 text-center">
            <div className="text-lg font-semibold text-black flex items-center justify-center gap-2">
              <span>Round: {currentRound} of</span>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxRounds}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(1000, Number(e.target.value) || 1));
                  setMaxRounds(value);
                }}
                className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              />
            </div>
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
            <span className="text-xs text-gray-600 mb-3">{getStrategyDisplayName(player1Strategy)}</span>
            <div className="flex flex-col gap-1 mt-1">
              {availableStrategies.map((strategyName) => (
                <button
                  key={strategyName}
                  onClick={() => handleStrategyChange(1, strategyName)}
                  className={`px-3 py-1 text-xs rounded transition-colors font-medium ${
                    player1Strategy === strategyName
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {getStrategyDisplayName(strategyName)}
                </button>
              ))}
            </div>
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
            <span className="text-xs text-gray-600 mb-3">{getStrategyDisplayName(player2Strategy)}</span>
            <div className="flex flex-col gap-1 mt-1">
              {availableStrategies.map((strategyName) => (
                <button
                  key={strategyName}
                  onClick={() => handleStrategyChange(2, strategyName)}
                  className={`px-3 py-1 text-xs rounded transition-colors font-medium ${
                    player2Strategy === strategyName
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {getStrategyDisplayName(strategyName)}
                </button>
              ))}
            </div>
          </div>
        </div>
          
        {/* Round Slider */}
        {roundStates.length > 1 && maxRounds > 0 && (
          <div className="w-full max-w-2xl px-8 pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Round: {Math.max(1, Math.min(currentRound, maxRounds))} / {maxRounds}
            </label>
            <input
              type="range"
              min="1"
              max={maxRounds}
              value={Math.max(1, Math.min(currentRound, maxRounds))}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: maxRounds > 1
                  ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((Math.max(1, Math.min(currentRound, maxRounds)) - 1) / (maxRounds - 1)) * 100}%, #e5e7eb ${((Math.max(1, Math.min(currentRound, maxRounds)) - 1) / (maxRounds - 1)) * 100}%, #e5e7eb 100%)`
                  : '#3b82f6'
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
            className="btn btn-primary px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={playNextRound}
            disabled={isPlaying || currentRound >= maxRounds}
          >
            Next Round
          </button>
        </div>
      </div>
    );
}

