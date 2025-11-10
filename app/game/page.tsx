"use client";
import Diamond from "@/components/diamond";
import { COOPERATE, DEFECT } from "@/constants";

export default function GamePage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
          {/* Top container */}
          <div className="w-full flex flex-col items-center pt-8 pb-8">
            <h1 className="text-2xl font-bold text-black">Prisoner's Dilemma</h1>
          </div>

          {/* Diamond container */}
          <div className="relative w-full flex-1 flex items-center justify-center px-4">
            {/* Left avatar */}
            <div className="absolute inset-y-0 left-6 md:left-24 flex flex-col justify-center items-center">
              <div className="avatar">
                <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                </div>
              </div>
              <span className="mt-2 text-sm font-medium text-black">You</span>
            </div>

            <div className="absolute z-10 text-center left-1/2 -translate-x-1/2 top-4 md:top-10 w-[90vw] max-w-xs md:max-w-sm lg:max-w-md">
              <div className="text-base md:text-lg font-semibold text-black">
                Round: {1} of {0}
              </div>
              <div className="text-sm md:text-md text-black mt-2">
                You: {0} | Opponent: {0}
              </div>
            </div>
            {/* Diamond, absolutely centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-0">
              <Diamond x={0} />
            </div>

            {/* Right avatar */}
            <div className="absolute inset-y-0 right-6 md:right-24 flex flex-col justify-center items-center">
              <div className="avatar">
                <div className="w-16 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2">
                </div>
              </div>
              <span className="mt-2 text-sm font-medium text-black">Opponent</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="w-full flex justify-center gap-4 pb-8 flex-wrap">
            <button
              className="btn px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-semibold"
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
