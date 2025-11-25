"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  FiArrowLeft,
  FiEdit,
  FiFileText,
  FiFolder,
  FiRefreshCw,
  
} from "react-icons/fi";

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
      alert("Failed to load folders");
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" leftIcon={<FiArrowLeft />}>
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Manage Question Sets</h1>
        <Button
          variant="outline"
          leftIcon={<FiRefreshCw />}
          onClick={loadFolders}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <FiFolder className="text-accent" />
            <CardTitle>Available Sets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {allFiles.map((f) => (
                <div
                  key={f.path}
                  className="w-full flex items-center gap-2 p-2 rounded border border-border"
                >
                  <div className="flex-1 flex items-center gap-2 text-left rounded px-1 py-0.5">
                    <FiFileText className="text-muted" />
                    <span className="truncate">{f.display}</span>
                  </div>
                  <Link href={`/sets/edit/${encodeURI(f.path)}`}>
                    <Button className="px-3 py-1 text-sm" leftIcon={<FiEdit />}>
                      Edit
                    </Button>
                  </Link>
                </div>
              ))}
              {allFiles.length === 0 && (
                <p className="text-sm text-muted">No sets found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
