"use client";

import { useState, useCallback } from "react";
import { COOPERATE, DIAMOND_MAPPING } from "@/constants";
import { Custom } from "@/game_components/strategies/custom";
import { GameComponentProps, RoundState } from "./types";
import { getDisplayTitle, getStrategyDisplayName, scaleToSpeed } from "./utils";
import { useGameStrategies } from "./hooks/useGameStrategies";
import { useGameInstance } from "./hooks/useGameInstance";
import { useRoundState } from "./hooks/useRoundState";
import { useWinner } from "./hooks/useWinner";
import { useGamePlayback } from "./hooks/useGamePlayback";
import { GameHeader } from "./components/GameHeader";
import { GamePlayers } from "./components/GamePlayers";
import { GameControls } from "./components/GameControls";
import { GameHistory } from "./components/GameHistory";
import { WinnerMessage } from "./components/WinnerMessage";

export default function GameComponent({
  mode = "game",
  title,
  roundLimit: maxRoundsLimit = mode === "game" ? 10000 : 1000,
  speedMax: speedScaleMax = mode === "game" ? 20 : 10,
  speedMin: speedScaleMin = mode === "game" ? 1 : 100,
  showWinner: showWinnerMessage = mode === "game",
  historyLog: showHistoryLog = mode === "game",
  selfPlayControls: showSelfPlayControls = mode === "game",
  customStrategy: allowCustomStrategy = mode === "game",
  p1Filter: player1StrategiesFilter,
  p2Filter: player2StrategiesFilter
}: GameComponentProps) {
  // State management
  const [currentRound, setCurrentRound] = useState(0);
  const [diamondChoice, setDiamondChoice] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [maxRounds, setMaxRounds] = useState(100);
  const [player1Strategy, setPlayer1Strategy] = useState<string>("AlwaysCooperate");
  const [player2Strategy, setPlayer2Strategy] = useState<string>("AlwaysCooperate");

  // Custom hooks
  const { p1Strategies, p2Strategies } = useGameStrategies(mode, player1StrategiesFilter, player2StrategiesFilter);
  
  // Safety check: ensure strategies are always arrays
  const safeP1Strategies = Array.isArray(p1Strategies) ? p1Strategies : ["AlwaysCooperate"];
  const safeP2Strategies = Array.isArray(p2Strategies) ? p2Strategies : ["AlwaysCooperate"];
  const { gameRef, recreateGame } = useGameInstance(player1Strategy, player2Strategy);
  const {
    roundStates,
    setRoundStates,
    createRoundState,
    updateStateFromRoundState,
    resetRoundStates
  } = useRoundState(gameRef);

  const { winnerMessage, winnerColor, winnerInfo } = useWinner(
    showWinnerMessage,
    currentRound,
    maxRounds,
    player1Score,
    player2Score,
    roundStates.length
  );

  // Helper function to set self-play choice
  const setSPChoice = useCallback((userChoice?: string) => {
    if (showSelfPlayControls && player1Strategy === "SelfPlay") {
      const choice = userChoice || COOPERATE;
      const selfPlayPlayer = gameRef.current?.players[0] as any;
      if (selfPlayPlayer && typeof selfPlayPlayer.setChoice === "function") {
        selfPlayPlayer.setChoice(choice);
      }
    }
  }, [showSelfPlayControls, player1Strategy, gameRef]);

  // Execute a single round
  const executeRound = useCallback((roundNumber: number, userChoice?: string): RoundState => {
    setSPChoice(userChoice);
    const result = gameRef.current?.round(roundNumber);
    if (!result) {
      throw new Error("Game round failed");
    }
    return createRoundState(roundNumber, result);
  }, [setSPChoice, gameRef, createRoundState]);

  // Play next round handler
  const playNextRound = useCallback((userChoice?: string) => {
    if (currentRound >= maxRounds) return;

    if (mode === "game") {
      const newRound = currentRound + 1;
      setRoundStates(prevStates => {
        const roundExists = prevStates.some(state => state.round === newRound);
        if (roundExists) {
          const existingRound = prevStates.find(state => state.round === newRound);
          if (existingRound) {
            updateStateFromRoundState(existingRound, {
              setDiamondChoice,
              setPlayer1Score,
              setPlayer2Score,
              setCurrentRound
            });
          }
          return prevStates;
        }

        const newRoundState = executeRound(newRound, userChoice);
        updateStateFromRoundState(newRoundState, {
          setDiamondChoice,
          setPlayer1Score,
          setPlayer2Score,
          setCurrentRound
        });
        return [...prevStates, newRoundState];
      });
    } else {
      // Simulation mode
      const result = gameRef.current?.round(currentRound + 1);
      if (!result) return;

      const outcome = result.p1_choice + result.p2_choice;
      const diamondIndex = (DIAMOND_MAPPING[outcome as keyof typeof DIAMOND_MAPPING] || 0) as 0 | 1 | 2 | 3 | 4;
      const newRound = currentRound + 1;
      const newPlayer1Score = gameRef.current?.players[0].getScore() || 0;
      const newPlayer2Score = gameRef.current?.players[1].getScore() || 0;

      const newRoundState: RoundState = {
        round: newRound,
        choice: diamondIndex,
        p1Score: newPlayer1Score,
        p2Score: newPlayer2Score,
        result
      };

      setRoundStates(prevStates => [...prevStates, newRoundState]);
      setDiamondChoice(diamondIndex);
      setPlayer1Score(newPlayer1Score);
      setPlayer2Score(newPlayer2Score);
      setCurrentRound(newRound);
    }
  }, [currentRound, maxRounds, mode, gameRef, executeRound, setRoundStates, updateStateFromRoundState]);

  const handleSliderChange = useCallback((roundNumber: number) => {
    const roundState = roundStates.find(state => state.round === roundNumber);
    if (roundState) {
      if (mode === "game") {
        updateStateFromRoundState(roundState, {
          setDiamondChoice,
          setPlayer1Score,
          setPlayer2Score,
          setCurrentRound
        });
      } else {
        setCurrentRound(roundState.round);
        setDiamondChoice(roundState.choice);
        setPlayer1Score(roundState.p1Score);
        setPlayer2Score(roundState.p2Score);
      }
    }
  }, [roundStates, mode, updateStateFromRoundState]);

  // Game playback hook
  useGamePlayback({
    isPlaying,
    speed,
    maxRounds,
    mode,
    currentRound,
    gameRef,
    executeRound,
    updateStateFromRoundState: (roundState: RoundState) => updateStateFromRoundState(roundState, {
      setDiamondChoice,
      setPlayer1Score,
      setPlayer2Score,
      setCurrentRound
    }),
    setRoundStates,
    setCurrentRound,
    setIsPlaying,
    setDiamondChoice,
    setPlayer1Score,
    setPlayer2Score
  });

  // Reset game
  const resetGame = useCallback(() => {
    resetRoundStates();
    updateStateFromRoundState({
      round: 0,
      choice: 0,
      p1Score: 0,
      p2Score: 0,
      result: { p1_choice: "", p2_choice: "", scores: [0, 0] }
    }, {
      setDiamondChoice,
      setPlayer1Score,
      setPlayer2Score,
      setCurrentRound
    });
    setIsPlaying(false);
  }, [resetRoundStates, updateStateFromRoundState]);

  // Strategy change handler
  const handleStrategyChange = useCallback((player: 1 | 2, strategyName: string) => {
    if (player === 1) {
      setPlayer1Strategy(strategyName);
    } else {
      setPlayer2Strategy(strategyName);
    }
    const newP1Strategy = player === 1 ? strategyName : player1Strategy;
    const newP2Strategy = player === 2 ? strategyName : player2Strategy;
    recreateGame(newP1Strategy, newP2Strategy);
    resetGame();
  }, [player1Strategy, player2Strategy, recreateGame, resetGame]);

  // Custom code save handler
  const handleSaveCustomCode = useCallback((player: 1 | 2, code: string) => {
    if (!allowCustomStrategy) return;

    let needsRecreate = false;
    const playerIndex = player - 1;

    if (player === 1 && player1Strategy === "Custom" && gameRef.current?.players[playerIndex] instanceof Custom) {
      (gameRef.current.players[playerIndex] as Custom).setStrategyCode(code);
      console.log("Updated Player 1 Custom strategy");
    } else if (player === 2 && player2Strategy === "Custom" && gameRef.current?.players[playerIndex] instanceof Custom) {
      (gameRef.current.players[playerIndex] as Custom).setStrategyCode(code);
      console.log("Updated Player 2 Custom strategy");
    } else if ((player === 1 && player1Strategy === "Custom") || (player === 2 && player2Strategy === "Custom")) {
      needsRecreate = true;
    }

    if (needsRecreate) {
      recreateGame(player1Strategy, player2Strategy);
    }
    resetGame();
  }, [allowCustomStrategy, player1Strategy, player2Strategy, gameRef, recreateGame, resetGame]);

  const displayTitle = getDisplayTitle(title, mode);
  const scaleToSpeedFn = useCallback((scale: number) => scaleToSpeed(scale, speedScaleMin, speedScaleMax), [speedScaleMin, speedScaleMax]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans py-4 sm:py-6 md:py-8">
      <WinnerMessage message={winnerMessage} color={winnerColor} />
      
      <GameHeader
        title={displayTitle}
        currentRound={currentRound}
        maxRounds={maxRounds}
        maxRoundsLimit={maxRoundsLimit}
        player1Score={player1Score}
        player2Score={player2Score}
        roundStates={roundStates}
        mode={mode}
        onMaxRoundsChange={setMaxRounds}
      />

      <GamePlayers
        mode={mode}
        diamondChoice={diamondChoice}
        player1Strategy={player1Strategy}
        player2Strategy={player2Strategy}
        p1Strategies={safeP1Strategies}
        p2Strategies={safeP2Strategies}
        showSelfPlayControls={showSelfPlayControls}
        allowCustomStrategy={allowCustomStrategy}
        isPlaying={isPlaying}
        currentRound={currentRound}
        maxRounds={maxRounds}
        onStrategyChange={handleStrategyChange}
        onSaveCustomCode={allowCustomStrategy ? handleSaveCustomCode : undefined}
        onPlayNextRound={playNextRound}
        getStrategyDisplayName={getStrategyDisplayName}
      />

      <GameControls
        roundStates={roundStates}
        maxRounds={maxRounds}
        currentRound={currentRound}
        speed={speed}
        speedScaleMax={speedScaleMax}
        speedScaleMin={speedScaleMin}
        mode={mode}
        isPlaying={isPlaying}
        showSelfPlayControls={showSelfPlayControls}
        player1Strategy={player1Strategy}
        onSliderChange={handleSliderChange}
        onSpeedChange={setSpeed}
        onTogglePlayPause={() => setIsPlaying(!isPlaying)}
        onPlayNextRound={() => playNextRound()}
        onReset={resetGame}
        scaleToSpeed={scaleToSpeedFn}
      />

      {showHistoryLog && roundStates.length > 1 && (
        <GameHistory
          roundStates={roundStates}
          maxRounds={maxRounds}
          getWinnerInfo={() => winnerInfo}
        />
      )}
    </div>
  );
}
