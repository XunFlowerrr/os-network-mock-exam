"use client";
import React, { memo } from "react";
import Link from "next/link";
import {
  FiFileText,
  FiFolder,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi";
import { countAllFiles, type FolderData } from "@/lib/folderUtils";

type FolderItemProps = {
  folder: FolderData;
  basePath?: string;
  isRandom?: boolean;
  expandedFolders: Set<string>;
  onToggle: (path: string) => void;
};

const FolderItem = memo(function FolderItem({
  folder,
  basePath = "",
  isRandom = false,
  expandedFolders,
  onToggle,
}: FolderItemProps) {
  const folderPath = basePath ? `${basePath}/${folder.name}` : folder.name;
  const isExpanded = expandedFolders.has(folderPath);
  const hasChildren = folder.children && folder.children.length > 0;
  const hasFiles = folder.files && folder.files.length > 0;
  const deepCount = countAllFiles([folder]);

  return (
    <div className="space-y-2">
      <button
        onClick={() => onToggle(folderPath)}
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
          {folder.files.map((file) => {
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

          {folder.children &&
            folder.children.map((child) => (
              <FolderItem
                key={child.name}
                folder={child}
                basePath={folderPath}
                isRandom={isRandom}
                expandedFolders={expandedFolders}
                onToggle={onToggle}
              />
            ))}
        </div>
      )}
    </div>
  );
});

export default FolderItem;
