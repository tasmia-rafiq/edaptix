import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "student" | "teacher";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  expertise?: string[]; // teacher
  bio?: string; // teacher
  interests?: string[]; // student
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], default: "student" },
    expertise: { type: [String], default: undefined }, // array of subjects for teachers
    bio: { type: String, default: "" },
    interests: { type: [String], default: undefined }, // array of interests for students
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);