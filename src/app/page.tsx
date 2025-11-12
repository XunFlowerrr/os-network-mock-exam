"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  FiUploadCloud,
  FiDatabase,
  FiShuffle,
  FiSearch,
  FiGitBranch,
  FiFileText,
  FiFolder,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi";

export default function Home() {
  const [folderStructure, setFolderStructure] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  // Expand top-level roots by default for better UX
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["no-random", "random"])
  );

  useEffect(() => {
    fetchFolderStructure();
  }, []);

  const fetchFolderStructure = async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      setFolderStructure(data.folders || []);
    } catch (error) {
      console.error("Error fetching folder structure:", error);
    }
  };

  const handleSyncToGithub = async () => {
    try {
      setSyncing(true);
      const response = await fetch("/api/sync", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        // Refresh the folder structure
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
  };

  const collectAllFiles = (folders: any[], folderName: string): any[] => {
    const result: any[] = [];
    for (const folder of folders) {
      if (folder.name === folderName) {
        const collectFromFolder = (f: any): any[] => {
          const files = f.files.map((file: any) => file.name);
          for (const child of f.children || []) {
            files.push(...collectFromFolder(child));
          }
          return files;
        };
        result.push(...collectFromFolder(folder));
      }
    }
    return result;
  };

  const filteredNoRandom = useMemo(
    () =>
      collectAllFiles(folderStructure, "no-random").filter((name: string) =>
        name.toLowerCase().includes(query.toLowerCase())
      ),
    [folderStructure, query]
  );

  const filteredRandom = useMemo(
    () =>
      collectAllFiles(folderStructure, "random").filter((name: string) =>
        name.toLowerCase().includes(query.toLowerCase())
      ),
    [folderStructure, query]
  );

  const countAllFiles = (folders: any[]): number => {
    let count = 0;
    for (const folder of folders) {
      count += folder.files.length;
      if (folder.children && folder.children.length > 0) {
        count += countAllFiles(folder.children);
      }
    }
    return count;
  };

  // Used for the progress bar demo
  const totalFiles = useMemo(
    () => countAllFiles(folderStructure),
    [folderStructure]
  );

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const FolderItem = ({
    folder,
    basePath = "",
    isRandom = false,
  }: {
    folder: any;
    basePath?: string;
    isRandom?: boolean;
  }) => {
    const folderPath = basePath ? `${basePath}/${folder.name}` : folder.name;
    const isExpanded = expandedFolders.has(folderPath);
    const hasChildren = folder.children && folder.children.length > 0;
    const hasFiles = folder.files && folder.files.length > 0;
    const deepCount = countAllFiles([folder]);

    return (
      <div className="space-y-2">
        <button
          onClick={() => toggleFolder(folderPath)}
          className="flex items-center gap-2 w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors group"
          aria-expanded={isExpanded}
        >
          {hasChildren || hasFiles ? (
            isExpanded ? (
              <FiChevronDown className="text-accent" />
            ) : (
              <FiChevronRight className="text-accent" />
            )
          ) : (
            <FiChevronRight className="opacity-0" />
          )}
          <FiFolder
            className={`shrink-0 ${isExpanded ? "text-accent" : "text-muted"}`}
          />
          <span className="font-medium group-hover:text-accent transition-colors">
            {folder.name}
          </span>
          {(hasChildren || hasFiles) && (
            <span className="ml-auto text-xs text-foreground/80 bg-muted/60 border border-border px-2 py-1 rounded">
              {deepCount} sets
            </span>
          )}
        </button>

        {isExpanded && (
          <div className="ml-6 space-y-2 border-l border-border/60 pl-4">
            {/* Render files in this folder */}
            {folder.files.map((file: any) => {
              const trimmedPath = isRandom
                ? (file.path || "").replace(/^random\//, "")
                : (file.path || "").replace(/^no-random\//, "");
              const href = isRandom
                ? `/quiz/random/${trimmedPath}`
                : `/quiz/${trimmedPath}`;
              return (
                <Link
                  key={file.name}
                  href={href}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/5 hover:shadow-soft dark:hover:shadow-soft-dark transition group relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FiFileText className="text-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate group-hover:text-accent transition-colors">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted truncate">{file.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase tracking-wide text-muted bg-muted/30 border border-border px-2 py-0.5 rounded">
                      JSON
                    </span>
                    <FiChevronRight className="text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
                </Link>
              );
            })}

            {/* Render subfolders */}
            {folder.children &&
              folder.children.map((child: any) => (
                <FolderItem
                  key={child.name}
                  folder={child}
                  basePath={folderPath}
                  isRandom={isRandom}
                />
              ))}
          </div>
        )}
      </div>
    );
  };

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
                  {folderStructure.find((f: any) => f.name === "random")
                    ? countAllFiles([
                        folderStructure.find((f: any) => f.name === "random"),
                      ])
                    : 0}
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
          {folderStructure.find((f: any) => f.name === "random") ? (
            <FolderItem
              folder={folderStructure.find((f: any) => f.name === "random")}
              isRandom={true}
            />
          ) : (
            <p className="text-sm text-muted">No random sets found.</p>
          )}
        </section>
      </div>
    </div>
  );
}
