"use client";
import Diamond from "@/components/diamond";
import Link from "next/link";
import { useState } from "react";
const choices = [0,1,2,3,4];


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <Link className="btn btn-primary" href="/setup">Setup</Link>
      <Link className="btn btn-primary" href="/game">Game</Link>
      <Link className="btn btn-primary" href="/rules">Rules</Link>
    </div>
  );
}
