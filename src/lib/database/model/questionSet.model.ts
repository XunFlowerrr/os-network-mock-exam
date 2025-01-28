import mongoose, { Schema, model, Document } from "mongoose";

// Interface for an individual option
export interface IOption {
  statement: string;
  isCorrect: boolean;
}

// Updated Interface for an individual question
export interface IQuestion {
  question: string;
  options: IOption[];
  explanation: string;
}

// Interface for the QuestionSet document
export interface IQuestionSet extends Document {
  title: string;
  description?: string; // optional field
  public: boolean;
  ownerId: string; // Reference to the user who created the set
  questions: IQuestion[];
}

// Schema for embedded options
const OptionSchema = new Schema<IOption>(
  {
    statement: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false },
  },
  { _id: false } // Disable _id for subdocuments if not needed
);

// Schema for embedded questions
const QuestionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [OptionSchema], required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

// Schema for Question Set, including the special "defaultLoad" field
const QuestionSetSchema = new Schema<IQuestionSet>(
  {
    title: { type: String, required: true },
    description: { type: String }, // optional
    public: { type: Boolean, required: true, default: false, index: true },
    ownerId: { type: String, required: true },
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
