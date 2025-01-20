"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getDefaultQuestionSetList } from "@/lib/action/questionSet.action";
import { IQuestionSetMeta } from "@/lib/database/model/questionSetMeta.model";
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function Home() {
  // Update sets state to handle objects with name and displayName

  const { isAuthenticated, user } = useKindeBrowserClient();

  console.log(isAuthenticated);
  console.log(user);
  const [sets, setSets] = useState<{ name: string; displayName: string }[]>([]);
  const [fileData, setFileData] = useState<any>(null);
  const [renameSet, setRenameSet] = useState("");
  const [defaultSets, setDefaultSets] = useState<IQuestionSetMeta[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const sets = await getDefaultQuestionSetList();

        setDefaultSets(sets);
      } catch (error) {
        console.error("Error fetching default question sets:", error);
      }
    }
    fetchData();
  }, []);

  // Handle file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const jsonData = JSON.parse(reader.result as string);
        // Save to local storage (replace with your own handling if desired)
        localStorage.setItem("importedQuestionSet", JSON.stringify(jsonData));
        setFileData(jsonData);
      } catch (error) {
        console.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleSetRename = async () => {
    if (fileData && renameSet.trim()) {
      try {
        const response = await fetch("/api/sets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: renameSet.trim(),
            data: fileData,
          }),
        });

        if (response.ok) {
          setRenameSet("");
          alert(`Set saved as "${renameSet.trim()}".`);
          // Optionally refresh the sets list
          const res = await fetch("/api/sets");
          const data = await res.json();
          setSets(data);
        } else {
          alert("Failed to save the set.");
        }
      } catch (error) {
        console.error("Error saving the set:", error);
        alert("An error occurred while saving the set.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-xl p-4">
      {isAuthenticated ? (
        <LogoutLink>Logout</LogoutLink>
      ) : (
        <>
          <LoginLink>Sign in</LoginLink>
          <RegisterLink>Sign up</RegisterLink>
        </>
      )}

      {/* File import interface */}
      {/* <div className="mb-4">
        <label className="mr-2">Import new question set:</label>
        <input type="file" accept=".json" onChange={handleFileImport} />
      </div> */}

      {/* Optional preview */}
      {fileData && <pre>{JSON.stringify(fileData, null, 2)}</pre>}

      {/* Rename interface (only shown if a fileData is imported) */}
      {fileData && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rename set"
            value={renameSet}
            onChange={(e) => setRenameSet(e.target.value)}
            className="mr-2 p-1 border rounded"
          />
          <button onClick={handleSetRename} className="p-1 border rounded">
            Save as
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Welcome to the Quiz Home</h1>
      <ul>
        {defaultSets.map((set, index) => (
          <li key={index} className="mb-2">
            <Link href={`/quiz/${set.questionSetId}`}>
              <div className="flex bg-slate-300 bg-opacity-20 p-2 rounded-md cursor-pointer hover:scale-[101%] transition-all duration-75">
                <span className="hover">{set.title}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
