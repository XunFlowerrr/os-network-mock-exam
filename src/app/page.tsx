"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type FolderData } from "@/lib/folderUtils";
import { Search, GitBranch, Play, Edit, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SetItem = { name: string; path: string; folder: string };

function flattenSets(node: FolderData, folderLabel = ""): SetItem[] {
  const list: SetItem[] = [];
  for (const f of node.files || []) {
    if (!f.path) continue;
    list.push({ name: f.name, path: f.path, folder: folderLabel || node.name });
  }
  for (const c of node.children || []) {
    const childLabel = folderLabel ? `${folderLabel} / ${c.name}` : c.name;
    list.push(...flattenSets(c, childLabel));
  }
  return list;
}

function SetCard({ set, showFolder }: { set: SetItem; showFolder?: boolean }) {
  const router = useRouter();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/quiz/${encodeURI(set.path)}`)}
      onKeyDown={(e) =>
        e.key === "Enter" && router.push(`/quiz/${encodeURI(set.path)}`)
      }
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4",
        "hover:border-primary/40 hover:bg-accent/20 transition-all duration-200 cursor-pointer",
        "h-[72px] overflow-hidden",
      )}
    >
      <p className="text-sm font-medium leading-snug line-clamp-1 pr-12">
        {set.name.replace(/\.json$/, "").replace(/[-_]/g, " ")}
      </p>
      {showFolder && (
        <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wide font-medium">
          {set.folder}
        </p>
      )}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/sets/edit/${encodeURI(set.path)}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground transition-colors">
            <Edit className="h-3 w-3" />
          </span>
        </Link>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Play className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [folderStructure, setFolderStructure] = useState<FolderData[]>([]);
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [activeFolder, setActiveFolder] = useState("");

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

  const handleSync = useCallback(async () => {
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
    } catch {
      toast.error("Failed to sync to GitHub.");
    } finally {
      setSyncing(false);
    }
  }, [fetchFolderStructure]);

  const randomFolder = useMemo(
    () => folderStructure.find((f) => f.name === "random"),
    [folderStructure],
  );

  const allSets = useMemo(
    () => (randomFolder ? flattenSets(randomFolder) : []),
    [randomFolder],
  );

  const folders = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const s of allSets) {
      if (!seen.has(s.folder)) {
        seen.add(s.folder);
        list.push(s.folder);
      }
    }
    return list;
  }, [allSets]);

  const groupedSets = useMemo(() => {
    const map = new Map<string, SetItem[]>();
    for (const s of allSets) {
      if (!map.has(s.folder)) map.set(s.folder, []);
      map.get(s.folder)!.push(s);
    }
    return map;
  }, [allSets]);

  const filteredSets = useMemo(() => {
    const q = query.toLowerCase();
    let base = activeFolder ? (groupedSets.get(activeFolder) ?? []) : allSets;
    if (q)
      base = base.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.folder.toLowerCase().includes(q),
      );
    return base;
  }, [allSets, query, activeFolder, groupedSets]);

  const isGrouped = !query && !activeFolder;
  const totalCount = allSets.length;
  const isLoading = folderStructure.length === 0;

  return (
    <div className="space-y-0">
      {/* ── Hero ── */}
      <section className="relative pb-12 pt-4">
        {/* Dot-grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 90% 90% at 50% 50%, #000 40%, transparent 100%)",
          }}
        />

        <div className="relative space-y-8">
          {/* Top meta row */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted-foreground/60">
              OS · Network · Practice
            </p>
            <Button
              variant="ghost"
              size="sm"
              loading={syncing}
              onClick={handleSync}
              leftIcon={<GitBranch className="h-3.5 w-3.5" />}
              className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
            >
              {syncing ? "Syncing…" : "Sync"}
            </Button>
          </div>

          {/* Main headline + big count */}
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-2">
              <h1
                className="font-black leading-none tracking-tighter"
                style={{ fontSize: "clamp(2.8rem, 9vw, 5.5rem)" }}
              >
                <span className="gradient-text block">Master</span>
                <span className="text-foreground block">the exam.</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                Operating Systems &amp; Networking — structured question sets
                for deep practice.
              </p>
            </div>

            {!isLoading && (
              <div className="shrink-0 text-right select-none pb-1">
                <p
                  className="font-black tabular-nums leading-none text-primary/15 dark:text-primary/10"
                  style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}
                >
                  {String(totalCount).padStart(2, "0")}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mt-1">
                  sets
                </p>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="group relative">
            <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-primary/40 via-violet-500/30 to-primary/40 opacity-0 blur-sm transition-opacity duration-500 group-focus-within:opacity-100" />
            <div className="relative flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 transition-colors group-focus-within:border-primary/40">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search question sets…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Folder filter pills ── */}
      {!isLoading && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveFolder("")}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
              !activeFolder
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            All
            <span
              className={cn(
                "flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                !activeFolder
                  ? "bg-white/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {totalCount}
            </span>
          </button>

          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFolder(activeFolder === f ? "" : f)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                activeFolder === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {f}
              <span
                className={cn(
                  "flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                  activeFolder === f
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {groupedSets.get(f)?.length ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="flex items-center gap-4 pt-3">
        <div className="h-px flex-1 bg-border" />
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
          {isLoading
            ? "loading…"
            : activeFolder
              ? `${activeFolder} · ${filteredSets.length}`
              : `${filteredSets.length} sets`}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* ── Sets section ── */}
      <section className="pt-5">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        ) : filteredSets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Search className="h-8 w-8 opacity-20" />
            <p className="text-sm">
              {query ? `No sets match "${query}"` : "No sets found."}
            </p>
            {(query || activeFolder) && (
              <button
                onClick={() => {
                  setQuery("");
                  setActiveFolder("");
                }}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : isGrouped ? (
          /* ── Grouped by folder ── */
          <div className="space-y-10">
            {folders.map((folderName) => {
              const sets = groupedSets.get(folderName) ?? [];
              if (sets.length === 0) return null;
              return (
                <div key={folderName}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setActiveFolder(folderName)}
                      className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground/50 hover:text-primary transition-colors whitespace-nowrap"
                    >
                      {folderName}
                    </button>
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground/30 shrink-0">
                      {sets.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {sets.map((set) => (
                      <SetCard key={set.path} set={set} showFolder={false} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Flat filtered / single-folder grid ── */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredSets.map((set) => (
              <SetCard key={set.path} set={set} showFolder={!activeFolder} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
