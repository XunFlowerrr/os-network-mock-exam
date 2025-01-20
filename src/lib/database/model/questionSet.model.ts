import mongoose, { Schema, model, Document } from "mongoose";

// Interface for an individual question
export interface IQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

// Interface for the QuestionSet document
export interface IQuestionSet extends Document {
  title: string;
  description?: string; // optional field
  defaultLoad: boolean; // special field to load for everyone
  questions: IQuestion[];
}

// Schema for embedded questions
const QuestionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

// Schema for Question Set, including the special "defaultLoad" field
const QuestionSetSchema = new Schema<IQuestionSet>(
  {
    title: { type: String, required: true },
    description: { type: String }, // optional
    defaultLoad: { type: Boolean, default: false }, // set true as default
    questions: { type: [QuestionSchema], required: true },
  },
  {
    collection: "questionsets", // Specify the exact collection name
  }
);

const QuestionSet =
  mongoose.models.QuestionSet ||
  model<IQuestionSet>("QuestionSet", QuestionSetSchema);

export default QuestionSet;
