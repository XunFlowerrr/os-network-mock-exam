"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [sets, setSets] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any>(null);
  const [renameSet, setRenameSet] = useState("");

  useEffect(() => {
    fetch("/api/sets")
      .then((res) => res.json())
      .then((data) => setSets(data));
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
      {/* File import interface */}
      <div className="mb-4">
        <label className="mr-2">Import new question set:</label>
        <input type="file" accept=".json" onChange={handleFileImport} />
      </div>

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
        {sets.map((setName) => (
          <li key={setName} className="mb-2">
            <Link href={`/quiz/${setName.replace(".json", "")}`}>
              <span className="text-blue-600 hover:underline">
                {setName.replace(".json", "")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
