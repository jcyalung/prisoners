"use client";
import Diamond from "@/components/diamond";
import { useState, useRef } from "react";
import { Game } from "@/game_components/game";
import { SelfPlay } from "@/game_components/strategies/selfplay";
import { AlwaysCooperate } from "@/game_components/strategies/alwayscooperate";
import { AlwaysDefect } from "@/game_components/strategies/alwaysdefect";
import { DIAMOND_MAPPING, COOPERATE, DEFECT } from "@/constants";

export default function GamePage() {
    const [numRounds, setNumRounds] = useState<null | number>(null);
    const [currentRound, setCurrentRound] = useState(0);
    const [diamondChoice, setDiamondChoice] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [player1Score, setPlayer1Score] = useState(0);
    const [player2Score, setPlayer2Score] = useState(0);
    
    const gameRef = useRef<Game>(
        new Game([new SelfPlay("SelfPlay", 0, []), new AlwaysDefect("", 0, [])])
    );

    const playRound = (userChoice: string) => {
        const selfPlayPlayer = gameRef.current.players[0] as SelfPlay;
        selfPlayPlayer.setChoice(userChoice);
        
        const result = gameRef.current.round(currentRound + 1);
        const outcome = result.p1_choice + result.p2_choice;
        const diamondIndex = DIAMOND_MAPPING[outcome as keyof typeof DIAMOND_MAPPING] || 0;
        
        setDiamondChoice(diamondIndex as 0 | 1 | 2 | 3 | 4);
        setPlayer1Score(gameRef.current.players[0].getScore());
        setPlayer2Score(gameRef.current.players[1].getScore());
        setCurrentRound(currentRound + 1);
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
        {/* Top container */}
        <div className="w-full flex flex-col items-center pt-8 pb-8">
          <h1 className="text-2xl font-bold text-black">Prisoner's Dilemma</h1>
          <div className="mt-2 text-center">
            <div className="text-lg font-semibold text-black">Round: {1}</div>
            <div className="text-md text-black mt-2">You: {0} | Opponent: {0}</div>
          </div>
        </div>
          
        {/* 3-column layout */}
        <div className="grid grid-cols-3 items-center justify-items-center w-full flex-1 px-4 gap-4">
          {/* Left avatar */}
          <div className="flex flex-col items-center">
            <div className="avatar">
              <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src="/you-avatar.png" alt="You" />
              </div>
            </div>
            <span className="mt-2 text-sm font-medium text-black">You</span>
          </div>
          
          {/* Diamond in the center */}
          <div className="flex justify-center items-center">
            <Diamond x={0} />
          </div>
          
          {/* Right avatar */}
          <div className="flex flex-col items-center">
            <div className="avatar">
              <div className="w-16 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2">
                <img src="/opponent-avatar.png" alt="Opponent" />
              </div>
            </div>
            <span className="mt-2 text-sm font-medium text-black">Opponent</span>
          </div>
        </div>
          
        {/* Buttons */}
        <div className="w-full flex justify-center gap-4 pb-8 flex-wrap">
          <button
            className="btn btn-success px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-semibold"
            onClick={() => console.log('COOPERATE')}
          >
            Cooperate (C)
          </button>
          <button
            className="btn px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold"
            onClick={() => console.log('DEFECT')}
          >
            Defect (D)
          </button>
        </div>
      </div>

    );
}

 