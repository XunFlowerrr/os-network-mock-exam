"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  FiCopy,
  FiSave,
  FiArrowLeft,
  FiCheck,
  FiFolder,
  FiFolderPlus,
} from "react-icons/fi";

export default function ImportPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [folders, setFolders] = useState<
    { name: string; path: string; fileCount: number; files: string[] }[]
  >([]);
  const [selectedFolder, setSelectedFolder] = useState("random");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Please enter a folder name.");
      return;
    }

    try {
      setCreatingFolder(true);
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        setFolders([...folders, result.folder]);
        setSelectedFolder(result.folder.name);
        setNewFolderName("");
        setShowNewFolder(false);
        alert("Folder created successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create folder.");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Error creating folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    try {
      setSaving(true);
      let jsonData;
      try {
        jsonData = JSON.parse(content);
      } catch (error) {
        alert("Invalid JSON content.");
        return;
      }

      // Sanitize filename: replace spaces with underscores and remove forward slashes
      const sanitizedTitle = title
        .trim()
        .replace(/\s+/g, "_")
        .replace(/\//g, "_");

      const response = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sanitizedTitle,
          data: jsonData,
          folder: selectedFolder,
        }),
      });

      if (response.ok) {
        alert("Set saved successfully!");
        router.push("/");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to save the set.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving set");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPrompt = () => {
    const prompt = `คุณเป็น 'ผู้ออกแบบข้อสอบ' คุณจะได้รับเนื้อหามาแล้วคุณจะออกข้อสอบอย่างมืออาชีพ คุณจะทดสอบความเข้าใจในหลายๆ ด้าน เช่น

Recall (การจดจำ)
Understanding (ความเข้าใจ)
Application (การประยุกต์ใช้)
Analysis (การวิเคราะห์)
Evaluation (การประเมินค่า)
และเขียนตอบใน Code block ตาม format ดังต่อไปนี้
JSON

{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "const": "multiple-choice"
      },
      "question": {
        "type": "string"
      },
      "options": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "statement": {
              "type": "string"
            },
            "istrue": {
              "type": "boolean"
            }
          },
          "required": [
            "statement",
            "istrue"
          ]
        }
      },
      "explanation": {
        "type": "string"
      }
    },
    "required": [
      "type",
      "question",
      "options",
      "explanation"
    ]
  }
}
Purpose and Goals:
สร้างชุดคำถามที่หลากหลายเพื่อประเมินความเข้าใจของผู้ใช้ในเนื้อหาที่ได้รับ
คำถามต้องครอบคลุมทักษะการคิดเชิงวิเคราะห์และการประยุกต์ใช้ความรู้ ไม่ใช่แค่การจดจำ
ให้คำตอบอยู่ในรูปแบบ JSON ที่เป็น multiple-choice ตามที่กำหนดไว้ในคำสั่ง
Behaviors and Rules:
Initial Inquiry: a. ทักทายผู้ใช้และแจ้งว่าคุณพร้อมที่จะสร้างข้อสอบปรนัย (multiple-choice) จากเนื้อหาที่พวกเขามอบให้ b. ขอให้ผู้ใช้ระบุเนื้อหาที่ต้องการให้สร้างคำถาม c. หากผู้ใช้ยังไม่มีเนื้อหา ให้เสนอหัวข้อทั่วไปเพื่อสร้างตัวอย่างคำถาม
Question Generation and Presentation: a. วิเคราะห์เนื้อหาที่ได้รับอย่างละเอียดเพื่อสร้างคำถามที่เหมาะสม b. สร้างคำถามอย่างน้อย 5 ข้อที่ครอบคลุมประเภทต่างๆ ที่ระบุไว้ c. จัดรูปแบบคำตอบให้อยู่ใน Code block และตรวจสอบให้แน่ใจว่าเป็น JSON ที่ถูกต้องตาม schema ที่ให้มา d. สำหรับช่อง "question" ให้สร้างเป็นข้อความคำถามที่สมบูรณ์ โดยห้ามใส่ประเภทของคำถาม เช่น (Recall) เข้าไปในข้อความโดยเด็ดขาด e. สำหรับช่อง "explanation" ให้เขียนเป็นคำอธิบายเชิงข้อเท็จจริง (Factual Statement) ที่กระชับและตรงไปตรงมา โดยอธิบายเหตุผลว่าทำไมคำตอบนั้นจึงถูกต้อง ห้ามขึ้นต้นด้วยข้อความชี้นำ เช่น "คำตอบที่ถูกต้องคือ", "จากเนื้อหา", หรือ "ถูกต้องครับ"
Overall Tone:
ใช้ภาษาที่เป็นทางการและเป็นมืออาชีพ
แสดงความสามารถและความเชี่ยวชาญในการออกแบบข้อสอบ
ให้คำตอบที่ชัดเจนและแม่นยำ
หลีกเลี่ยงการใช้คำพูดที่ดูเป็นกันเองมากเกินไป`;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" leftIcon={<FiArrowLeft />}>
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Import Question Set</h1>
        <p className="text-muted">
          Enter the title and paste the JSON content of your question set.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title (Filename)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter the title for your question set"
            className="w-full px-3 py-2 rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {title.trim() && (
            <p className="text-xs text-muted mt-1">
              Filename:{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {title.trim().replace(/\s+/g, "_").replace(/\//g, "_")}.json
              </code>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Folder</label>
          <div className="space-y-3">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {folders.map((folder) => (
                <option key={folder.name} value={folder.name}>
                  📁 {folder.name} ({folder.fileCount} files)
                </option>
              ))}
            </select>

            {!showNewFolder ? (
              <Button
                onClick={() => setShowNewFolder(true)}
                variant="outline"
                leftIcon={<FiFolderPlus />}
                className="w-full"
              >
                Create New Folder
              </Button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateFolder}
                    loading={creatingFolder}
                    leftIcon={<FiFolder />}
                    className="flex-1"
                  >
                    Create Folder
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewFolder(false);
                      setNewFolderName("");
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Question Set Content (JSON)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your JSON question set here"
            rows={20}
            className="w-full px-3 py-2 rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
          />
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleCopyPrompt}
            variant="outline"
            leftIcon={copied ? <FiCheck /> : <FiCopy />}
            className={
              copied ? "bg-green-50 border-green-200 text-green-700" : ""
            }
          >
            {copied ? "Copied!" : "Copy Prompt"}
          </Button>
          <Button onClick={handleSave} loading={saving} leftIcon={<FiSave />}>
            Save Question Set
          </Button>
        </div>
      </div>
    </div>
  );
}
