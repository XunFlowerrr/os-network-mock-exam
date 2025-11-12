"use client";
import React from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import Button from "./ui/Button";
import { usePathname } from "next/navigation";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
      <div className="mx-auto max-w-5xl px-4 flex items-center h-14 gap-4">
        <Link
          href="/"
          className="font-bold tracking-tight gradient-text text-lg"
        >
          QuizHub
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={
              pathname === "/"
                ? "text-accent"
                : "text-muted hover:text-foreground"
            }
          >
            Home
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Sets
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
