import mongoose, { Schema, model, Document } from "mongoose";

// ...existing code...

export interface IQuestionSetMeta extends Document {
  title: string;
  defaultLoad: boolean;
  questionSetId: mongoose.Types.ObjectId; // Reference to QuestionSet
  description?: string;
  // ...existing code...
}

const QuestionSetMetaSchema = new Schema<IQuestionSetMeta>(
  {
    title: { type: String, required: true },
    defaultLoad: { type: Boolean, default: false },
    description: { type: String },
    questionSetId: {
      type: Schema.Types.ObjectId,
      ref: "QuestionSet",
      required: true,
    },
    // ...existing code...
  },
  {
    timestamps: true,
    collection: "questionsetmeta",
  }
);

// ...existing code...

const QuestionSetMeta =
  mongoose.models.QuestionSetMeta ||
  model<IQuestionSetMeta>("QuestionSetMeta", QuestionSetMetaSchema);

// ...existing code...

export default QuestionSetMeta;
