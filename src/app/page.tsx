"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FolderItem from "@/components/FolderItem";
import { countAllFiles, type FolderData } from "@/lib/folderUtils";
import {
  UploadCloud,
  Database,
  Shuffle,
  Search,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";

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
        toast.success(result.message);
        fetchFolderStructure();
      } else {
        toast.error(`Sync failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(
        "Failed to sync to GitHub. Please check the console for details.",
      );
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

  const isLoading = folderStructure.length === 0;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="gradient-text">Quiz Collections</span>
          </h1>
          <Button
            onClick={handleSyncToGithub}
            loading={syncing}
            variant="outline"
            leftIcon={<GitBranch className="h-4 w-4" />}
            size="sm"
          >
            <span className="hidden sm:inline">
              {syncing ? "Syncing..." : "Sync"}
            </span>
          </Button>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Practice Operating System &amp; Networking concepts with structured
          and randomized question sets.
        </p>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sets..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {isLoading ? (
          <>
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                <CardTitle>Import Question Set</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Create a new question set by entering the title and JSON
                  content.
                </p>
                <Link href="/import">
                  <Button
                    className="w-full"
                    leftIcon={<UploadCloud className="h-4 w-4" />}
                  >
                    Go to Import Page
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Saved Sets Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40 mb-4">
                  <span className="text-sm text-muted-foreground uppercase tracking-wide">
                    Random Sets
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-base font-bold px-3 py-1"
                  >
                    {randomSetCount}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">
                    Completion Tracker (demo)
                  </p>
                  <Progress value={Math.min(100, totalFiles * 3)} />
                </div>
                <div className="mt-4">
                  <Link href="/sets/manage">
                    <Button className="w-full" variant="outline">
                      Manage Sets
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Random Sets browser */}
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Random Sets</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : randomFolder ? (
            <FolderItem
              folder={randomFolder}
              isRandom={true}
              expandedFolders={expandedFolders}
              onToggle={toggleFolder}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No random sets found.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
