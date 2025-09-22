"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from "react-icons/fi";

type Option = {
  statement: string;
  istrue: boolean;
};

type Question = {
  type: string;
  question: string;
  options: Option[];
  explanation: string;
  image?: string;
};

export default function EditSetPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const setPath = useMemo(() => slug.join("/"), [slug]);

  useEffect(() => {
    if (setPath) loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPath]);

  const loadSet = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sets/${encodeURI(setPath)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load set");
        setQuestions([]);
      } else {
        const arr = Array.isArray(data.data) ? data.data : [];
        // Normalize questions/options to our expected shape
        const normalized: Question[] = arr.map((q: any) => {
          const qType =
            typeof q.type === "string" && q.type.trim()
              ? q.type
              : "multiple-choice";
          const qText =
            typeof q.question === "string"
              ? q.question
              : String(q.question ?? "");
          const rawOptions: any[] = Array.isArray(q.options)
            ? q.options
            : Array.isArray(q.choices)
            ? q.choices
            : Array.isArray(q.answers)
            ? q.answers
            : [];

          const options: Option[] = rawOptions.map((o: any) => {
            // Support different key names and string-only options
            if (typeof o === "string") {
              return { statement: o, istrue: false };
            }
            const statement =
              typeof o.statement === "string" && o.statement.length > 0
                ? o.statement
                : typeof o.text === "string"
                ? o.text
                : typeof o.label === "string"
                ? o.label
                : typeof o.content === "string"
                ? o.content
                : typeof o.choice === "string"
                ? o.choice
                : typeof o.option === "string"
                ? o.option
                : "";

            const istrue =
              typeof o.istrue === "boolean"
                ? o.istrue
                : typeof o.isTrue === "boolean"
                ? o.isTrue
                : typeof o.correct === "boolean"
                ? o.correct
                : typeof o.answer === "boolean"
                ? o.answer
                : false;

            return { statement, istrue };
          });

          const explanation =
            typeof q.explanation === "string"
              ? q.explanation
              : String(q.explanation ?? "");
          const image = typeof q.image === "string" ? q.image : undefined;

          return {
            type: qType,
            question: qText,
            options,
            explanation,
            image,
          };
        });
        setQuestions(normalized);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load set");
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  };

  const updateOption = (qIdx: number, oIdx: number, patch: Partial<Option>) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oIdx ? { ...o, ...patch } : o
              ),
            }
          : q
      )
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        type: "multiple-choice",
        question: "",
        options: [{ statement: "", istrue: false }],
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: [...q.options, { statement: "", istrue: false }] }
          : q
      )
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.filter((_, j) => j !== oIdx) }
          : q
      )
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/sets/${encodeURI(setPath)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: questions }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to save");
      } else {
        alert("Saved");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sets/manage">
          <Button variant="ghost" leftIcon={<FiArrowLeft />}>
            Back to Manage
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold truncate">
          Edit Set: {setPath}.json
        </h1>
        <div className="ml-auto">
          <Button onClick={save} loading={saving} leftIcon={<FiSave />}>
            Save
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex items-center gap-2">
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {loading && <p className="text-muted">Loading...</p>}
            {!loading && questions.length === 0 && (
              <p className="text-muted">No questions. Add one below.</p>
            )}

            {questions.map((q, qi) => (
              <div
                key={qi}
                className="border border-border rounded-lg p-4 space-y-3 bg-card"
              >
                <div className="flex gap-3 items-center">
                  <input
                    value={q.type}
                    onChange={(e) =>
                      updateQuestion(qi, { type: e.target.value })
                    }
                    className="w-40 px-2 py-1 rounded border border-border bg-background"
                    placeholder="type"
                  />
                  <input
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(qi, { question: e.target.value })
                    }
                    className="flex-1 px-2 py-1 rounded border border-border bg-background"
                    placeholder={`Question #${qi + 1}`}
                  />
                  <Button
                    variant="outline"
                    leftIcon={<FiTrash2 />}
                    onClick={() => removeQuestion(qi)}
                  >
                    Remove
                  </Button>
                </div>

                {/* Image section */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Image (optional)</p>
                  {q.image && (
                    <div className="flex items-start gap-3">
                      <img
                        src={`/api/images-serve/${encodeURI(q.image)}`}
                        alt="question"
                        className="max-h-40 rounded border border-border"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={q.image || ""}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          image: e.target.value || undefined,
                        })
                      }
                      placeholder={`${setPath}/image-name.png`}
                      className="flex-1 px-2 py-1 rounded border border-border bg-background"
                    />
                    <label className="px-3 py-1 rounded border border-border bg-background cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (ev) => {
                          const file = ev.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append("file", file);
                          const uploadRes = await fetch(
                            `/api/images/${encodeURI(setPath)}`,
                            {
                              method: "POST",
                              body: formData,
                            }
                          );
                          const result = await uploadRes.json();
                          if (!uploadRes.ok) {
                            alert(result.message || "Upload failed");
                          } else {
                            const storedName: string = result.file;
                            updateQuestion(qi, {
                              image: `${setPath}/${storedName}`,
                            });
                          }
                        }}
                      />
                      Upload
                    </label>
                    {q.image && (
                      <Button
                        variant="outline"
                        leftIcon={<FiTrash2 />}
                        onClick={async () => {
                          const delRes = await fetch(
                            `/api/images/${encodeURI(q.image!)}`,
                            { method: "DELETE" }
                          );
                          if (!delRes.ok) {
                            const msg = await delRes.json().catch(() => ({}));
                            alert(msg.message || "Failed to delete image");
                          } else {
                            updateQuestion(qi, { image: undefined });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Options</p>
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={o.istrue}
                        onChange={(e) =>
                          updateOption(qi, oi, { istrue: e.target.checked })
                        }
                      />
                      <input
                        value={o.statement}
                        onChange={(e) =>
                          updateOption(qi, oi, { statement: e.target.value })
                        }
                        className="flex-1 px-2 py-1 rounded border border-border bg-background"
                        placeholder={`Choice #${oi + 1}`}
                      />
                      <Button
                        variant="outline"
                        leftIcon={<FiTrash2 />}
                        onClick={() => removeOption(qi, oi)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    leftIcon={<FiPlus />}
                    onClick={() => addOption(qi)}
                  >
                    Add Option
                  </Button>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Explanation</p>
                  <textarea
                    value={q.explanation}
                    onChange={(e) =>
                      updateQuestion(qi, { explanation: e.target.value })
                    }
                    rows={3}
                    className="w-full px-2 py-1 rounded border border-border bg-background"
                    placeholder="Explanation"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              leftIcon={<FiPlus />}
              onClick={addQuestion}
            >
              Add Question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
