import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

export default (mongoose.models.Enrollment as mongoose.Model<IEnrollment>) ||
  mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
