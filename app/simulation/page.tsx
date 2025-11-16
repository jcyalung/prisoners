"use client";
import GameComponent from "@/components/game/game";

export default function SimulationPage() {
    return (
        <GameComponent
            mode="simulation"
            roundLimit={1000}
            speedMax={10}
            speedMin={100}
            showWinner={false}
            historyLog={false}
            selfPlayControls={false}
            customStrategy={false}
        />
    );
}

