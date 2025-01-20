"use server";

import QuestionSetMeta, {
  IQuestionSetMeta,
} from "../database/model/questionSetMeta.model";
import { connectToDatabase } from "../database/mongoose"; // Ensure correct import

export async function getDefaultQuestionSetList(): Promise<IQuestionSetMeta[]> {
  try {
    await connectToDatabase();
    const questionSet = await QuestionSetMeta.find({ defaultLoad: true });
    console.log("Fetched question set:", questionSet); // Added logging
    console.log("Type of question set:", typeof questionSet); // Added logging
    return questionSet;
  } catch (error) {
    console.error("Error fetching question set:", error); // Added error logging
    return [];
  }
}
