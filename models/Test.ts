// models/Test.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IOption {
  text: string;
}

export interface IQuestion {
  text: string;
  options: IOption[];
  correctIndex: number; // -1 if not set
}

export interface ITest extends Document {
  title: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
  visibility?: "private" | "public";
}

const OptionSchema = new Schema<IOption>(
  {
    text: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    options: { type: [OptionSchema], required: true, validate: (v: any[]) => v && v.length >= 2 },
    correctIndex: { type: Number, required: true, default: -1 },
  },
  { _id: true }
);

const TestSchema = new Schema<ITest>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questions: { type: [QuestionSchema], default: [] },
    visibility: { type: String, enum: ["private", "public"], default: "private" },
  },
  { timestamps: true }
);

export default (mongoose.models.Test as mongoose.Model<ITest>) ||
  mongoose.model<ITest>("Test", TestSchema);
