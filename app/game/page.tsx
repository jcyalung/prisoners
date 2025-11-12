"use client";
import GameComponent from "@/components/game/game";
import Strategies from "@/game_components/strategies";

export default function GamePage() {
    const allStrategies = Object.keys(Strategies).filter(key => 
        key !== "default" && typeof Strategies[key] === "function"
    );
    
    return (
        <GameComponent
            mode="game"
            maxRoundsLimit={10000}
            speedScaleMax={20}
            speedScaleMin={1}
            showWinnerMessage={true}
            showHistoryLog={true}
            showSelfPlayControls={true}
            allowCustomStrategy={true}
            player1StrategiesFilter={() => allStrategies}
            player2StrategiesFilter={(strategies) => strategies.filter(strategy => strategy !== "SelfPlay" && strategy !== "Custom")}
        />
    );
}

