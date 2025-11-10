"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    opponentStrategy: "AlwaysCooperate",
    numberOfRounds: 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store form data and navigate to game page
    // You can use localStorage, URL params, or state management here
    const params = new URLSearchParams({
      name: formData.name,
      opponentStrategy: formData.opponentStrategy,
      numberOfRounds: formData.numberOfRounds.toString(),
    });
    router.push(`/game?${params.toString()}`);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "numberOfRounds" ? parseInt(value) || 1 : value,
    }));
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-black text-center mb-8">
          Game Setup
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Your name */}
          <div className="form-control">
            <label htmlFor="name" className="label">
              <span className="label-text text-black font-semibold">
                Your name
              </span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input input-bordered w-full bg-white text-black border-gray-300 focus:border-primary focus:outline-none"
              placeholder="Enter your name"
            />
          </div>

          {/* Opponent Strategy */}
          <div className="form-control">
            <label htmlFor="opponentStrategy" className="label">
              <span className="label-text text-black font-semibold">
                Opponent Strategy
              </span>
            </label>
            <select
              id="opponentStrategy"
              name="opponentStrategy"
              value={formData.opponentStrategy}
              onChange={handleChange}
              className="select select-bordered w-full bg-white text-black border-gray-300 focus:border-primary focus:outline-none"
            >
              <option value="AlwaysCooperate">Always Cooperate</option>
              <option value="AlwaysDefect">Always Defect</option>
              <option value="SelfPlay">Self Play</option>
            </select>
          </div>

          {/* Number of rounds */}
          <div className="form-control">
            <label htmlFor="numberOfRounds" className="label">
              <span className="label-text text-black font-semibold">
                Number of rounds
              </span>
            </label>
            <input
              type="number"
              id="numberOfRounds"
              name="numberOfRounds"
              value={formData.numberOfRounds}
              onChange={handleChange}
              required
              min="1"
              className="input input-bordered w-full bg-white text-black border-gray-300 focus:border-primary focus:outline-none"
              placeholder="Enter number of rounds"
            />
          </div>

          {/* Submit button */}
          <div className="form-control mt-8">
            <button
              type="submit"
              className="btn w-full bg-primary text-primary-content hover:bg-primary/90 font-semibold py-3"
            >
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

