"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FiUploadCloud, FiDatabase, FiShuffle, FiSearch } from "react-icons/fi";

export default function Home() {
  const [sets, setSets] = useState<{ noRandom: string[]; random: string[] }>({
    noRandom: [],
    random: [],
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/sets")
      .then((res) => res.json())
      .then((data) => setSets(data));
  }, []);

  const filteredNoRandom = useMemo(
    () =>
      sets.noRandom.filter((n) =>
        n.toLowerCase().includes(query.toLowerCase())
      ),
    [sets.noRandom, query]
  );
  const filteredRandom = useMemo(
    () =>
      sets.random.filter((n) => n.toLowerCase().includes(query.toLowerCase())),
    [sets.random, query]
  );

  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          <span className="gradient-text">Quiz Collections</span>
        </h1>
        <p className="text-muted max-w-2xl mx-auto">
          Practice Operating System & Networking concepts with structured and
          randomized question sets.
        </p>
        <div className="relative max-w-md mx-auto">
          <FiSearch className="absolute top-1/2 -translate-y-1/2 left-3 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sets..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <FiUploadCloud className="text-accent" />
            <CardTitle>Import Question Set</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted mb-4">
              Create a new question set by entering the title and JSON content.
            </p>
            <Link href="/import">
              <Button className="w-full">
                <FiUploadCloud className="mr-2" />
                Go to Import Page
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <FiDatabase className="text-accent" />
            <CardTitle>Saved Sets Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg border border-border bg-background/50">
                <p className="text-2xl font-bold gradient-text">
                  {sets.noRandom.length}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Structured
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-background/50">
                <p className="text-2xl font-bold gradient-text">
                  {sets.random.length}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Random
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted">Completion Tracker (demo)</p>
              <ProgressBar
                value={Math.min(
                  100,
                  (sets.noRandom.length + sets.random.length) * 3
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FiDatabase className="text-accent" />
            <h2 className="text-xl font-semibold">Structured Sets</h2>
          </div>
          {filteredNoRandom.length === 0 && (
            <p className="text-sm text-muted">No sets found.</p>
          )}
          <ul className="grid sm:grid-cols-2 gap-3">
            {filteredNoRandom.map((setName) => {
              const clean = setName.replace(".json", "");
              return (
                <li key={setName}>
                  <Link
                    href={`/quiz/${clean}`}
                    className="block group border border-border rounded-lg px-4 py-3 bg-card hover:shadow-soft dark:hover:shadow-soft-dark transition relative overflow-hidden"
                  >
                    <span className="font-medium group-hover:text-accent transition-colors">
                      {clean}
                    </span>
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FiShuffle className="text-accent" />
            <h2 className="text-xl font-semibold">Random Sets</h2>
          </div>
          {filteredRandom.length === 0 && (
            <p className="text-sm text-muted">No sets found.</p>
          )}
          <ul className="grid sm:grid-cols-2 gap-3">
            {filteredRandom.map((setName) => {
              const clean = setName.replace(".json", "");
              return (
                <li key={setName}>
                  <Link
                    href={`/quiz/random/${clean}`}
                    className="block group border border-border rounded-lg px-4 py-3 bg-card hover:shadow-soft dark:hover:shadow-soft-dark transition relative overflow-hidden"
                  >
                    <span className="font-medium group-hover:text-accent transition-colors">
                      {clean}
                    </span>
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
