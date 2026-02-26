"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Edit, FileText, Folder, RefreshCw } from "lucide-react";

type FolderNode = {
  name: string;
  path: string;
  type: "folder";
  children: FolderNode[];
  files: { name: string; path: string; fullPath: string }[];
};

export default function ManageSetsPage() {
  const [folders, setFolders] = useState<FolderNode[]>([]);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const res = await fetch("/api/folders");
      const data = await res.json();
      setFolders(data.folders || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load folders");
    }
  };

  const allFiles = useMemo(() => {
    const list: { name: string; path: string; display: string }[] = [];
    const walk = (node: FolderNode) => {
      for (const f of node.files) {
        list.push({ name: f.name, path: f.path, display: f.path });
      }
      for (const c of node.children || []) walk(c);
    };
    for (const root of folders) walk(root);
    // Sort for convenience
    return list.sort((a, b) => a.display.localeCompare(b.display));
  }, [folders]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <h1 className="text-2xl font-semibold">Manage Question Sets</h1>
        <div className="ml-auto">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={loadFolders}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Folder className="h-5 w-5 text-primary" />
          <CardTitle>Available Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-2 pr-3">
              {allFiles.map((f) => (
                <div
                  key={f.path}
                  className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-accent/50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-sm">{f.display}</span>
                  <Link href={`/sets/edit/${encodeURI(f.path)}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Edit className="h-3.5 w-3.5" />}
                    >
                      Edit
                    </Button>
                  </Link>
                </div>
              ))}
              {allFiles.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No sets found.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
