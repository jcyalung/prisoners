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
            roundLimit={10000}
            speedMax={20}
            speedMin={1}
            showWinner={true}
            historyLog={true}
            selfPlayControls={true}
            customStrategy={true}
            p1Filter={() => allStrategies}
            p2Filter={(strategies) => strategies.filter(strategy => strategy !== "SelfPlay" && strategy !== "Custom")}
        />
    );
}

