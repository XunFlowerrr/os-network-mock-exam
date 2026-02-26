"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import FolderItem from "@/components/FolderItem";
import {
  countAllFiles,
  collectAllFiles,
  type FolderData,
} from "@/lib/folderUtils";
import {
  FiUploadCloud,
  FiDatabase,
  FiShuffle,
  FiSearch,
  FiGitBranch,
} from "react-icons/fi";

export default function Home() {
  const [folderStructure, setFolderStructure] = useState<FolderData[]>([]);
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  // Expand top-level roots by default for better UX
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["no-random", "random"]),
  );

  const fetchFolderStructure = useCallback(async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      setFolderStructure(data.folders || []);
    } catch (error) {
      console.error("Error fetching folder structure:", error);
    }
  }, []);

  useEffect(() => {
    fetchFolderStructure();
  }, [fetchFolderStructure]);

  const handleSyncToGithub = useCallback(async () => {
    try {
      setSyncing(true);
      const response = await fetch("/api/sync", { method: "POST" });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        fetchFolderStructure();
      } else {
        alert(`Sync failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Failed to sync to GitHub. Please check the console for details.");
    } finally {
      setSyncing(false);
    }
  }, [fetchFolderStructure]);

  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  }, []);

  const filteredNoRandom = useMemo(
    () =>
      collectAllFiles(folderStructure, "no-random").filter((name) =>
        name.toLowerCase().includes(query.toLowerCase()),
      ),
    [folderStructure, query],
  );

  const filteredRandom = useMemo(
    () =>
      collectAllFiles(folderStructure, "random").filter((name) =>
        name.toLowerCase().includes(query.toLowerCase()),
      ),
    [folderStructure, query],
  );

  const totalFiles = useMemo(
    () => countAllFiles(folderStructure),
    [folderStructure],
  );

  const randomFolder = useMemo(
    () => folderStructure.find((f) => f.name === "random"),
    [folderStructure],
  );

  const randomSetCount = useMemo(
    () => (randomFolder ? countAllFiles([randomFolder]) : 0),
    [randomFolder],
  );

  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="gradient-text">Quiz Collections</span>
          </h1>
          <Button
            onClick={handleSyncToGithub}
            loading={syncing}
            variant="outline"
            leftIcon={<FiGitBranch className="text-accent" />}
            className="px-3 py-2 text-sm"
          >
            <span className="hidden sm:inline">
              {syncing ? "Syncing..." : "Sync"}
            </span>
          </Button>
        </div>
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
              <Button
                className="w-full"
                leftIcon={<FiUploadCloud className="text-accent" />}
              >
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
            <div className="grid grid-cols-1 gap-4 text-center">
              <div className="p-3 rounded-lg border border-border bg-background/50">
                <p className="text-2xl font-bold gradient-text">
                  {randomSetCount}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Random Sets
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted">Completion Tracker (demo)</p>
              <ProgressBar value={Math.min(100, totalFiles * 3)} />
            </div>
            <div className="mt-6">
              <Link href="/sets/manage">
                <Button className="w-full">Manage Sets</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Random only (full width) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FiShuffle className="text-accent" />
            <h2 className="text-xl font-semibold">Random Sets</h2>
          </div>
          {randomFolder ? (
            <FolderItem
              folder={randomFolder}
              isRandom={true}
              expandedFolders={expandedFolders}
              onToggle={toggleFolder}
            />
          ) : (
            <p className="text-sm text-muted">No random sets found.</p>
          )}
        </section>
      </div>
    </div>
  );
}
