"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicQuestionSetList } from "@/lib/action/questionSet.action";
import { IQuestionSetMeta } from "@/lib/database/model/questionSetMeta.model";
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function Home() {
  const [defaultSets, setDefaultSets] = useState<IQuestionSetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useKindeBrowserClient();
  console.log("isAuthenticated", isAuthenticated);
  console.log("user", user);

  // Fetch the public question sets on component mount
  useEffect(() => {
    const fetchQuestionSets = async () => {
      try {
        const sets = await getPublicQuestionSetList();
        setDefaultSets(sets);
      } catch (error) {
        console.error("Error fetching default question sets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionSets();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-full flex-col">
      {/* Authentication Links */}
      {isAuthenticated ? (
        <LogoutLink>Logout</LogoutLink>
      ) : (
        <>
          <LoginLink>Sign in</LoginLink>
          <RegisterLink>Sign up</RegisterLink>
        </>
      )}

      <h1 className="text-2xl font-bold mb-4">Welcome to the Quiz Home</h1>

      {/* Display list of question sets */}
      <ul className="flex flex-col max-w-[50%]">
        {defaultSets.map((set) => (
          <li key={`${set.questionSetId}`} className="mb-2">
            <Link href={`/quiz/${set.questionSetId}`}>
              <div className="flex bg-slate-300 bg-opacity-20 p-2 rounded-md cursor-pointer hover:scale-[101%] transition-all duration-75">
                <span>{set.title}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
