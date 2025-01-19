"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [sets, setSets] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/sets")
      .then((res) => res.json())
      .then((data) => setSets(data));
  }, []);

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to the Quiz Home</h1>
      <ul>
        {sets.map((setName) => (
          <li key={setName} className="mb-2">
            <Link href={`/quiz/${setName.replace(".json", "")}`}>
              <span className="text-blue-600 hover:underline">
                {setName.replace(".json", "")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
