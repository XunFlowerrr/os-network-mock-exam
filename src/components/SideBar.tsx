"use client";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import React from "react";

function SideBar() {
  const { isAuthenticated, user } = useKindeBrowserClient();
  return (
    <div className="flex w-full max-w-[20vw] bg-foreground/15 text-foreground">
      {isAuthenticated ? (
        <div className="">{`You are authenticated as ${user?.email}`}</div>
      ) : (
        <div>You are not authenticated.</div>
      )}
    </div>
  );
}

export default SideBar;
