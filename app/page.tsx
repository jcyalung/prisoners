"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 font-sans px-4">
      <div className="w-full max-w-lg flex flex-col gap-8 items-center">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-zinc-800 mt-2 mb-1">Prisoner's Dilemma</h1>
          <p className="text-center text-base md:text-lg text-zinc-600 mb-2 px-2 md:px-0">
            Welcome! Explore strategies, simulate games, and learn the rules of the Prisoner&apos;s Dilemma.
          </p>
        </div>
        <nav className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
          <Link
            className="btn btn-primary flex-1 min-w-[140px] text-base py-3 rounded-md shadow hover:bg-blue-700 transition-colors text-center"
            href="/game"
          >
            Play Game
          </Link>
          <Link
            className="btn btn-primary flex-1 min-w-[140px] text-base py-3 rounded-md shadow hover:bg-blue-700 transition-colors text-center"
            href="/simulation"
          >
            Simulation
          </Link>
          <Link
            className="btn btn-secondary flex-1 min-w-[140px] text-base py-3 rounded-md shadow hover:bg-green-700 transition-colors text-center border border-green-600"
            href="/rules"
          >
            Rules & Info
          </Link>
        </nav>
      </div>
      <footer className="mt-10 text-gray-400 text-xs text-center">
        &copy; {new Date().getFullYear()} Iterated Prisoner&apos;s Dilemma &middot;
      </footer>
    </main>
  );
}
