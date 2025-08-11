"use client";
import React, { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import Button from "./ui/Button";

export const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <Button
      aria-label="Toggle theme"
      variant="ghost"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-10 h-10 p-0"
    >
      {theme === "light" ? <FiMoon /> : <FiSun />}
    </Button>
  );
};

export default ThemeToggle;
