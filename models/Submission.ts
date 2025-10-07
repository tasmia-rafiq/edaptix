import mongoose, {Schema, Document} from "mongoose";
import { type } from "os";
import { number } from "zod";


export interface ISubmission extends Document{
    testId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    answers:[] // Selected options indexes
    score : number;
    total: number;
    attempt: number;
    feedback: string;
    createdAt: Date;
    updatedAt: Date;

}

const SubmissionSchema = new Schema<ISubmission>(
    {
        testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
        studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        answers: { type: [Number], required: true },
        score: { type: Number, required: true },
        total: { type: Number, required: true },
        attempt: { type: Number, default: 1 },
        feedback:{type: String}
  },
  { timestamps: true }
    
);

SubmissionSchema.index({ testId: 1, studentId: 1 });

export default (mongoose.models.Submission as mongoose.Model<ISubmission>) ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);
