"use client";
import Diamond from "@/components/diamond/diamond";
import Player from "@/components/player/player";
import StrategyDropdown from "@/components/player/strategy-dropdown";
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

interface GameComponentProps {
    mode?: "game" | "simulation";
    title?: string;
    maxRoundsLimit?: number;
    speedScaleMax?: number;
    speedScaleMin?: number;
    showWinnerMessage?: boolean;
    showHistoryLog?: boolean;
    showSelfPlayControls?: boolean;
    allowCustomStrategy?: boolean;
    player1StrategiesFilter?: (strategies: string[]) => string[];
    player2StrategiesFilter?: (strategies: string[]) => string[];
}

export default function GameComponent({
    mode = "game",
    title,
    maxRoundsLimit = mode === "game" ? 10000 : 1000,
    speedScaleMax = mode === "game" ? 20 : 10,
    speedScaleMin = mode === "game" ? 1 : 100,
    showWinnerMessage = mode === "game",
    showHistoryLog = mode === "game",
    showSelfPlayControls = mode === "game",
    allowCustomStrategy = mode === "game",
    player1StrategiesFilter,
    player2StrategiesFilter
}: GameComponentProps) {
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
    const [speed, setSpeed] = useState(1000);
    const [maxRounds, setMaxRounds] = useState(10);
    const [player1Strategy, setPlayer1Strategy] = useState<string>("AlwaysCooperate");
    const [player2Strategy, setPlayer2Strategy] = useState<string>("AlwaysCooperate");
    const [isHistoryVisible, setIsHistoryVisible] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Get available strategy names
    const allStrategies = Object.keys(Strategies).filter(key => 
        key !== "default" && typeof Strategies[key] === "function"
    );
    
    // Apply filters to strategies
    const player1Strategies = player1StrategiesFilter 
        ? player1StrategiesFilter(allStrategies)
        : mode === "game" 
            ? allStrategies 
            : allStrategies;
    const player2Strategies = player2StrategiesFilter
        ? player2StrategiesFilter(allStrategies)
        : mode === "game"
            ? allStrategies.filter(strategy => strategy !== "SelfPlay" && strategy !== "Custom")
            : allStrategies;
    
    // Create a new game instance with current strategies
    const createGame = (p1Strategy: string, p2Strategy: string) => {
        const Strategy1 = Strategies[p1Strategy];
        const Strategy2 = Strategies[p2Strategy];
        if (Strategy1 && Strategy2) {
            const player1 = new Strategy1("Player 1", 0, []);
            const player2 = new Strategy2("Player 2", 0, []);
            return new Game([player1, player2]);
        }
        return new Game([new AlwaysCooperate("Player 1", 0, []), new AlwaysCooperate("Player 2", 0, [])]);
    };
    
    const gameRef = useRef<Game>(createGame(player1Strategy, player2Strategy));

    // Helper to set SelfPlay choice if needed
    const setSelfPlayChoiceIfNeeded = (userChoice?: string) => {
        if (showSelfPlayControls && player1Strategy === "SelfPlay") {
            const choice = userChoice || COOPERATE;
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
        
        if (mode === "game") {
            // Game mode: prevent duplicate rounds
            const newRound = currentRound + 1;
            
            setRoundStates(prevStates => {
                const roundExists = prevStates.some(state => state.round === newRound);
                if (roundExists) {
                    const existingRound = prevStates.find(state => state.round === newRound);
                    if (existingRound) {
                        updateStateFromRoundState(existingRound);
                    }
                    return prevStates;
                }
                
                const newRoundState = executeRound(newRound, userChoice);
                updateStateFromRoundState(newRoundState);
                return [...prevStates, newRoundState];
            });
        } else {
            // Simulation mode: simpler logic
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
        }
    };

    const handleSliderChange = (roundNumber: number) => {
        const roundState = roundStates.find(state => state.round === roundNumber);
        if (roundState) {
            if (mode === "game") {
                updateStateFromRoundState(roundState);
            } else {
                setCurrentRound(roundState.round);
                setDiamondChoice(roundState.diamondChoice);
                setPlayer1Score(roundState.player1Score);
                setPlayer2Score(roundState.player2Score);
            }
        }
    };

    // Auto-play effect
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
    }, [isPlaying, speed, maxRounds]);

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSpeedChange = (value: number) => {
        setSpeed(value);
    };

    // Convert speed (ms) to scale
    const speedToScale = (ms: number) => {
        const range = 3000 - speedScaleMin;
        const scaleRange = speedScaleMax - 1;
        return Math.round(((3000 - ms) / range) * scaleRange + 1);
    };

    const scaleToSpeed = (scale: number) => {
        const range = 3000 - speedScaleMin;
        const scaleRange = speedScaleMax - 1;
        return Math.round(3000 - ((scale - 1) / scaleRange) * range);
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
        const newP1Strategy = player === 1 ? strategyName : player1Strategy;
        const newP2Strategy = player === 2 ? strategyName : player2Strategy;
        gameRef.current = createGame(newP1Strategy, newP2Strategy);
        resetGame();
    };

    const handleSaveCustomCode = (player: 1 | 2, code: string) => {
        if (!allowCustomStrategy) return;
        
        let needsRecreate = false;
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
        
        if (needsRecreate) {
            gameRef.current = createGame(player1Strategy, player2Strategy);
            resetGame();
        } else {
            resetGame();
        }
    };

    const getStrategyDisplayName = (strategyName: string) => {
        return strategyName.replace(/([A-Z])/g, ' $1').trim();
    };

    // Determine winner message
    const getWinnerMessage = () => {
        if (!showWinnerMessage) return null;
        if (currentRound < maxRounds || roundStates.length <= 1) return null;
        
        if (player1Score > player2Score) return "Player 1 Wins!";
        if (player2Score > player1Score) return "Player 2 Wins!";
        return "It's a Tie!";
    };

    const winnerMessage = getWinnerMessage();
    
    const getWinnerColor = () => {
        if (winnerMessage === "It's a Tie!") return "bg-yellow-500";
        if (winnerMessage === "Player 1 Wins!") return "bg-blue-500";
        return "bg-purple-500";
    };

    const formatAction = (action: string) => {
        return action === COOPERATE ? "Cooperate" : "Defect";
    };

    const getWinnerInfo = () => {
        if (!showWinnerMessage) return null;
        if (currentRound < maxRounds || roundStates.length <= 1) return null;
        if (player1Score > player2Score) return { winner: "Player 1", score: player1Score, isTie: false };
        if (player2Score > player1Score) return { winner: "Player 2", score: player2Score, isTie: false };
        return { winner: null, score: player1Score, isTie: true };
    };

    const getClampedRound = () => Math.max(1, Math.min(currentRound, maxRounds));

    const displayTitle = title || (mode === "game" ? "Prisoner's Dilemma" : "Prisoner's Dilemma Simulation");

    return (
      <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans py-4 sm:py-6 md:py-8">
        {/* Winner Message */}
        {winnerMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg shadow-lg text-white font-bold text-base sm:text-lg md:text-xl ${getWinnerColor()}`}>
              {winnerMessage}
            </div>
          </div>
        )}
        
        {/* Top container */}
        <div className="w-full flex flex-col items-center pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">{displayTitle}</h1>
          <div className="mt-2 text-center">
            <div className="text-base sm:text-lg md:text-xl font-semibold text-black flex items-center justify-center gap-2 flex-wrap">
              <span>Round: {currentRound} of</span>
              <input
                type="number"
                min="1"
                max={maxRoundsLimit}
                value={maxRounds}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(maxRoundsLimit, Number(e.target.value) || 1));
                  setMaxRounds(value);
                }}
                className={`${mode === "game" ? "w-20 sm:w-24 md:w-28" : "w-16 sm:w-20 md:w-20"} px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm sm:text-base`}
              />
            </div>
            <div className="text-sm sm:text-base md:text-lg text-black mt-2">Player 1: {player1Score} | Player 2: {player2Score}</div>
            {currentRound > 0 && roundStates[currentRound] && (
              <div className="text-xs sm:text-sm text-gray-600 mt-1">
                Round {currentRound}: {roundStates[currentRound].result.p1_choice} vs {roundStates[currentRound].result.p2_choice}
              </div>
            )}
          </div>
        </div>
          
        {/* 3-column layout - responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-items-center w-full px-2 sm:px-4 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8 mt-8 sm:mt-12 md:mt-16">
          {/* Left player */}
          <div className="flex flex-col items-center">
            {mode === "game" ? (
              <>
                <Player
                  playerNumber={1}
                  currentStrategy={player1Strategy}
                  availableStrategies={player1Strategies}
                  onStrategyChange={handleStrategyChange}
                  getStrategyDisplayName={getStrategyDisplayName}
                  color="blue"
                  onSaveCustomCode={allowCustomStrategy ? (code) => handleSaveCustomCode(1, code) : undefined}
                />
                {showSelfPlayControls && player1Strategy === "SelfPlay" && !isPlaying && currentRound < maxRounds && (
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
              </>
            ) : (
              <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm">
                <div className="avatar">
                  <div className="w-12 sm:w-14 md:w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm md:text-base">P1</span>
                  </div>
                </div>
                <span className="mt-2 text-xs sm:text-sm font-medium text-black">Player 1</span>
                <div className="mt-2 w-full max-w-full">
                  <StrategyDropdown
                    currentStrategy={player1Strategy}
                    availableStrategies={player1Strategies}
                    onStrategyChange={(strategyName) => handleStrategyChange(1, strategyName)}
                    getStrategyDisplayName={getStrategyDisplayName}
                    color="blue"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Diamond in the center */}
          <div className="flex justify-center items-center py-8 sm:py-12 md:py-16">
            <Diamond x={diamondChoice} />
          </div>
          
          {/* Right player */}
          <div className="flex flex-col items-center">
            {mode === "game" ? (
              <Player
                playerNumber={2}
                currentStrategy={player2Strategy}
                availableStrategies={player2Strategies}
                onStrategyChange={handleStrategyChange}
                getStrategyDisplayName={getStrategyDisplayName}
                color="purple"
                onSaveCustomCode={allowCustomStrategy ? (code) => handleSaveCustomCode(2, code) : undefined}
              />
            ) : (
              <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm">
                <div className="avatar">
                  <div className="w-12 sm:w-14 md:w-16 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2 bg-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm md:text-base">P2</span>
                  </div>
                </div>
                <span className="mt-2 text-xs sm:text-sm font-medium text-black">Player 2</span>
                <div className="mt-2 w-full max-w-full">
                  <StrategyDropdown
                    currentStrategy={player2Strategy}
                    availableStrategies={player2Strategies}
                    onStrategyChange={(strategyName) => handleStrategyChange(2, strategyName)}
                    getStrategyDisplayName={getStrategyDisplayName}
                    color="purple"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
          
        {/* Round Slider */}
        {roundStates.length > 1 && maxRounds > 0 && (
          <div className="w-full max-w-2xl px-4 sm:px-6 md:px-8 pb-3 sm:pb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
        <div className="w-full max-w-2xl px-4 sm:px-6 md:px-8 pb-3 sm:pb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Speed: {speedToScale(speed)} / {speedScaleMax} ({speed === speedScaleMin && mode === "game" ? 'instant' : `${speed}ms`} per round)
          </label>
          <input
            type="range"
            min="1"
            max={speedScaleMax}
            value={speedToScale(speed)}
            onChange={(e) => handleSpeedChange(scaleToSpeed(Number(e.target.value)))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${((speedToScale(speed) - 1) / (speedScaleMax - 1)) * 100}%, #e5e7eb ${((speedToScale(speed) - 1) / (speedScaleMax - 1)) * 100}%, #e5e7eb 100%)`
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
            onClick={togglePlayPause}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            className="btn btn-primary px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            onClick={() => playNextRound()}
            disabled={isPlaying || currentRound >= maxRounds || (showSelfPlayControls && player1Strategy === "SelfPlay")}
          >
            Next Round
          </button>
        </div>

        {/* History Log */}
        {showHistoryLog && roundStates.length > 1 && (
          <div className="w-full max-w-4xl px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 mt-auto">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-5 md:p-6">
              <button
                onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                className="w-full flex items-center justify-between text-left cursor-pointer hover:opacity-80 transition-opacity mb-3 sm:mb-4"
              >
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black">Game History</h2>
                <svg
                  className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-600 transition-transform duration-200 ${
                    isHistoryVisible ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isHistoryVisible && (
                <div className="space-y-2 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
                  {roundStates.slice(1).map((roundState, index) => {
                    const roundNum = roundState.round;
                    const p1Action = formatAction(roundState.result.p1_choice);
                    const p2Action = formatAction(roundState.result.p2_choice);
                    const p1Points = roundState.result.scores[0];
                    const p2Points = roundState.result.scores[1];
                    const isFinalRound = roundNum === maxRounds;
                    const winnerInfo = isFinalRound ? getWinnerInfo() : null;
                    
                    return (
                      <div key={`round-${index}-${roundNum}`} className="text-xs sm:text-sm text-gray-700 pb-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          Round {roundNum}: P1 {p1Action}, P2 {p2Action}. P1 earns {p1Points} points, and P2 earns {p2Points} points.
                        </div>
                        {isFinalRound && winnerInfo && (
                          <div className="mt-2 font-bold text-base sm:text-lg">
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
              )}
            </div>
          </div>
        )}
      </div>
    );
}

