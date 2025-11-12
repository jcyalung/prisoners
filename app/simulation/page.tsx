"use client";
import GameComponent from "@/components/game/game";

export default function SimulationPage() {
    return (
        <GameComponent
            mode="simulation"
            maxRoundsLimit={1000}
            speedScaleMax={10}
            speedScaleMin={100}
            showWinnerMessage={false}
            showHistoryLog={false}
            showSelfPlayControls={false}
            allowCustomStrategy={false}
        />
    );
}

