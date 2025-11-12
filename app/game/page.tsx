"use client";
import Diamond from "@/components/diamond/diamond";
import Player from "@/components/player/player";
import { useState, useRef, useEffect } from "react";
import { Game } from "@/game_components/game";
import { AlwaysCooperate } from "@/game_components/strategies/alwayscooperate";
import { DIAMOND_MAPPING, COOPERATE, DEFECT } from "@/constants";
import Strategies from "@/game_components/strategies";
import { Custom } from "@/game_components/strategies/custom";

interface RoundState {
    round: number;
    diamondChoice: 0 | 1 | 2 | 3 | 4;
    player1Score: number;
    player2Score: number;   
    result: {p1_choice: string, p2_choice: string, scores: number[]};
}

export default function GamePage() {
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
    const allStrategies = Object.keys(Strategies).filter(key => 
        key !== "default" && typeof Strategies[key] === "function"
    );
    
    // Player 1 can use all strategies, Player 2 excludes SelfPlay and Custom
    const player1Strategies = allStrategies;
    const player2Strategies = allStrategies.filter(strategy => strategy !== "SelfPlay" && strategy !== "Custom");
    
    // Create a new game instance with current strategies
    const createGame = (p1Strategy: string, p2Strategy: string) => {
        const Strategy1 = Strategies[p1Strategy];
        const Strategy2 = Strategies[p2Strategy];
        if (Strategy1 && Strategy2) {
            // Custom constructor automatically loads code from localStorage
            const player1 = new Strategy1("Player 1", 0, []);
            const player2 = new Strategy2("Player 2", 0, []);
            return new Game([player1, player2]);
        }
        return new Game([new AlwaysCooperate("Player 1", 0, []), new AlwaysCooperate("Player 2", 0, [])]);
    };
    
    const gameRef = useRef<Game>(createGame(player1Strategy, player2Strategy));

    // Helper to set SelfPlay choice if needed
    const setSelfPlayChoiceIfNeeded = (userChoice?: string) => {
        if (player1Strategy === "SelfPlay") {
            const choice = userChoice || COOPERATE; // Default to COOPERATE for auto-play
            const selfPlayPlayer = gameRef.current.players[0] as any;
            if (selfPlayPlayer && typeof selfPlayPlayer.setChoice === "function") {
                selfPlayPlayer.setChoice(choice);
            }
        }
    };

    // Helper to create a round state from game result
    const createRoundState = (roundNumber: number, result: {p1_choice: string, p2_choice: string, scores: number[]}): RoundState => {
        const outcome = result.p1_choice + result.p2_choice;
        const diamondIndex = DIAMOND_MAPPING[outcome as keyof typeof DIAMOND_MAPPING] || 0;
        const newPlayer1Score = gameRef.current.players[0].getScore();
        const newPlayer2Score = gameRef.current.players[1].getScore();
        
        return {
            round: roundNumber,
            diamondChoice: diamondIndex as 0 | 1 | 2 | 3 | 4,
            player1Score: newPlayer1Score,
            player2Score: newPlayer2Score,
            result
        };
    };

    // Helper to update all state from a round state
    const updateStateFromRoundState = (roundState: RoundState) => {
        setDiamondChoice(roundState.diamondChoice);
        setPlayer1Score(roundState.player1Score);
        setPlayer2Score(roundState.player2Score);
        setCurrentRound(roundState.round);
    };

    // Core function to play a single round
    const executeRound = (roundNumber: number, userChoice?: string) => {
        setSelfPlayChoiceIfNeeded(userChoice);
        const result = gameRef.current.round(roundNumber);
        const roundState = createRoundState(roundNumber, result);
        return roundState;
    };

    const playNextRound = (userChoice?: string) => {
        if (currentRound >= maxRounds) return;
        
        const newRound = currentRound + 1;
        
        // Check if this round already exists to prevent duplicates
        setRoundStates(prevStates => {
            const roundExists = prevStates.some(state => state.round === newRound);
            if (roundExists) {
                // Round already exists, just update the display state
                const existingRound = prevStates.find(state => state.round === newRound);
                if (existingRound) {
                    updateStateFromRoundState(existingRound);
                }
                return prevStates;
            }
            
            // Round doesn't exist, create it
            const newRoundState = executeRound(newRound, userChoice);
            updateStateFromRoundState(newRoundState);
            return [...prevStates, newRoundState];
        });
    };

    const handleSliderChange = (roundNumber: number) => {
        // Find the roundState that matches this round number
        const roundState = roundStates.find(state => state.round === roundNumber);
        if (roundState) {
            updateStateFromRoundState(roundState);
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
                    const newRound = prevRound + 1;
                    
                    // Check if this round already exists to prevent duplicates
                    setRoundStates(prevStates => {
                        const roundExists = prevStates.some(state => state.round === newRound);
                        if (roundExists) return prevStates;
                        
                        const newRoundState = executeRound(newRound); // Auto-play uses default COOPERATE
                        updateStateFromRoundState(newRoundState);
                        return [...prevStates, newRoundState];
                    });
                    
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

    // Convert speed (ms) to a more intuitive scale (1-20, where 1 is slowest, 20 is instant/1ms)
    const speedToScale = (ms: number) => {
        // Speed range: 1ms (fastest/instant) to 3000ms (slowest)
        // Scale: 20 (fastest/instant) to 1 (slowest)
        return Math.round(((3000 - ms) / 2999) * 19 + 1);
    };

    const scaleToSpeed = (scale: number) => {
        // Scale: 1 (slowest) to 20 (fastest/instant)
        // Speed range: 3000ms (slowest) to 1ms (fastest/instant)
        return Math.round(3000 - ((scale - 1) / 19) * 2999);
    };

    // Reset game to initial state
    const resetGame = () => {
        const initialRoundState: RoundState = {
            round: 0,
            diamondChoice: 0,
            player1Score: 0,
            player2Score: 0,
            result: {p1_choice: "", p2_choice: "", scores: [0, 0]}
        };
        setRoundStates([initialRoundState]);
        updateStateFromRoundState(initialRoundState);
        setIsPlaying(false);
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
        resetGame();
    };


    const handleSaveCustomCode = (player: 1 | 2, code: string) => {
        // Code is already saved to localStorage by CodeEditor
        // Update existing Custom instances if they exist, otherwise recreate game
        let needsRecreate = false;
        
        // Update the specific player's Custom instance
        const playerIndex = player - 1;
        if (player === 1 && player1Strategy === "Custom" && gameRef.current.players[playerIndex] instanceof Custom) {
            (gameRef.current.players[playerIndex] as Custom).setStrategyCode(code);
            console.log("Updated Player 1 Custom strategy");
        } else if (player === 2 && player2Strategy === "Custom" && gameRef.current.players[playerIndex] instanceof Custom) {
            (gameRef.current.players[playerIndex] as Custom).setStrategyCode(code);
            console.log("Updated Player 2 Custom strategy");
        } else if ((player === 1 && player1Strategy === "Custom") || (player === 2 && player2Strategy === "Custom")) {
            needsRecreate = true;
        }
        
        // If we couldn't update directly, recreate the game
        if (needsRecreate) {
            gameRef.current = createGame(player1Strategy, player2Strategy);
            resetGame();
        } else {
            // Just reset the game state to reflect the new strategy
            resetGame();
        }
    };

    const getStrategyDisplayName = (strategyName: string) => {
        // Convert camelCase to Title Case with spaces
        return strategyName.replace(/([A-Z])/g, ' $1').trim();
    };

    // Determine winner message
    const getWinnerMessage = () => {
        // Only show winner message if we've completed all rounds and played at least one round
        // Check that we have round states beyond the initial state (round 0)
        if (currentRound < maxRounds || roundStates.length <= 1) return null;
        
        if (player1Score > player2Score) return "Player 1 Wins!";
        if (player2Score > player1Score) return "Player 2 Wins!";
        return "It's a Tie!";
    };

    const winnerMessage = getWinnerMessage();
    
    // Helper to get winner message color
    const getWinnerColor = () => {
        if (winnerMessage === "It's a Tie!") return "bg-yellow-500";
        if (winnerMessage === "Player 1 Wins!") return "bg-blue-500";
        return "bg-purple-500";
    };

    // Helper to format action
    const formatAction = (action: string) => {
        return action === COOPERATE ? "Cooperate" : "Defect";
    };

    // Helper to get winner info
    const getWinnerInfo = () => {
        if (currentRound < maxRounds || roundStates.length <= 1) return null;
        if (player1Score > player2Score) return { winner: "Player 1", score: player1Score, isTie: false };
        if (player2Score > player1Score) return { winner: "Player 2", score: player2Score, isTie: false };
        return { winner: null, score: player1Score, isTie: true }; // Tie
    };

    // Helper to calculate clamped round value for slider
    const getClampedRound = () => Math.max(1, Math.min(currentRound, maxRounds));

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
        {/* Winner Message */}
        {winnerMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className={`px-8 py-4 rounded-lg shadow-lg text-white font-bold text-xl ${getWinnerColor()}`}>
              {winnerMessage}
            </div>
          </div>
        )}
        
        {/* Top container */}
        <div className="w-full flex flex-col items-center pt-8 pb-8">
          <h1 className="text-2xl font-bold text-black">Prisoner's Dilemma</h1>
          <div className="mt-2 text-center">
            <div className="text-lg font-semibold text-black flex items-center justify-center gap-2">
              <span>Round: {currentRound} of</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={maxRounds}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(10000, Number(e.target.value) || 1));
                  setMaxRounds(value);
                }}
                className="w-30 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
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
            <Player
              playerNumber={1}
              currentStrategy={player1Strategy}
              availableStrategies={player1Strategies}
              onStrategyChange={handleStrategyChange}
              getStrategyDisplayName={getStrategyDisplayName}
              color="blue"
              onSaveCustomCode={(code) => handleSaveCustomCode(1, code)}
            />
            {/* Show cooperate/defect buttons when player 1 uses SelfPlay */}
            {player1Strategy === "SelfPlay" && !isPlaying && currentRound < maxRounds && (
              <div className="flex flex-col gap-2 mt-4">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-semibold"
                  onClick={() => playNextRound(COOPERATE)}
                >
                  Cooperate
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold"
                  onClick={() => playNextRound(DEFECT)}
                >
                  Defect
                </button>
              </div>
            )}
          </div>
          
          {/* Diamond in the center */}
          <div className="flex justify-center items-center">
            <Diamond x={diamondChoice} />
          </div>
          
          {/* Right player */}
          <div className="flex flex-col items-center">
            <Player
              playerNumber={2}
              currentStrategy={player2Strategy}
              availableStrategies={player2Strategies}
              onStrategyChange={handleStrategyChange}
              getStrategyDisplayName={getStrategyDisplayName}
              color="purple"
              onSaveCustomCode={(code) => handleSaveCustomCode(2, code)}
            />
          </div>
        </div>
          
        {/* Round Slider */}
        {roundStates.length > 1 && maxRounds > 0 && (
          <div className="w-full max-w-2xl px-8 pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Round: {getClampedRound()} / {maxRounds}
            </label>
            <input
              type="range"
              min="1"
              max={maxRounds}
              value={getClampedRound()}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: maxRounds > 1
                  ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((getClampedRound() - 1) / (maxRounds - 1)) * 100}%, #e5e7eb ${((getClampedRound() - 1) / (maxRounds - 1)) * 100}%, #e5e7eb 100%)`
                  : '#3b82f6'
              }}
            />
          </div>
        )}

        {/* Speed Slider */}
        <div className="w-full max-w-2xl px-8 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speed: {speedToScale(speed)} / 20 ({speed === 1 ? 'instant' : `${speed}ms`} per round)
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={speedToScale(speed)}
            onChange={(e) => handleSpeedChange(scaleToSpeed(Number(e.target.value)))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${((speedToScale(speed) - 1) / 19) * 100}%, #e5e7eb ${((speedToScale(speed) - 1) / 19) * 100}%, #e5e7eb 100%)`
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
            onClick={() => playNextRound()}
            disabled={isPlaying || currentRound >= maxRounds || player1Strategy === "SelfPlay"}
          >
            Next Round
          </button>
        </div>

        {/* History Log */}
        {roundStates.length > 1 && (
          <div className="w-full max-w-4xl px-8 pb-8">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-black mb-4">Game History</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {roundStates.slice(1).map((roundState, index) => {
                  const roundNum = roundState.round;
                  const p1Action = formatAction(roundState.result.p1_choice);
                  const p2Action = formatAction(roundState.result.p2_choice);
                  const p1Points = roundState.result.scores[0];
                  const p2Points = roundState.result.scores[1];
                  const isFinalRound = roundNum === maxRounds;
                  const winnerInfo = isFinalRound ? getWinnerInfo() : null;
                  
                  return (
                    <div key={`round-${index}-${roundNum}`} className="text-sm text-gray-700 pb-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        Round {roundNum}: P1 {p1Action}, P2 {p2Action}. P1 earns {p1Points} points, and P2 earns {p2Points} points.
                      </div>
                      {isFinalRound && winnerInfo && (
                        <div className="mt-2 font-bold text-lg">
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
            </div>
          </div>
        )}

      </div>
    );
}

