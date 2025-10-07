// models/Course.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ILesson {
  title: string;
  type: "video" | "article";
  content: string;
  testId?: mongoose.Types.ObjectId | string;
  summary?: string;
  durationMinutes?: number | null;
}

export interface ICourse extends Document {
  title: string;
  subtitle?: string;
  slug?: string;
  description?: string;
  coverImage?: string;
  category?: string;
  level?: string;
  language?: string;
  tags?: string[];
  price?: number;
  estimatedDuration?: number; // minutes total
  published?: boolean;
  createdBy: mongoose.Types.ObjectId;
  lessons: ILesson[];
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["video", "article"], default: "video" },
    content: { type: String, required: true },
    testId: { type: Schema.Types.ObjectId, ref: "Test" },
    summary: { type: String },
    durationMinutes: { type: Number },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    slug: { type: String, index: true },
    description: { type: String },
    coverImage: { type: String },
    category: { type: String },
    level: { type: String },
    language: { type: String },
    tags: { type: [String], default: [] },
    price: { type: Number, default: 0 },
    estimatedDuration: { type: Number }, // minutes
    published: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lessons: { type: [LessonSchema], default: [] },
  },
  { timestamps: true }
);

export default (mongoose.models.Course as mongoose.Model<ICourse>) ||
  mongoose.model<ICourse>("Course", CourseSchema);
