// app/api/analytics/teacher/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import Submission from "@/models/Submission";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user as any).role !== "teacher")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get all tests created by this teacher
  const tests = await Test.find({ createdBy: (user as any)._id }).lean();
  const testIds = tests.map(t => t._id);

  // Aggregate submissions for those tests
  const submissions = await Submission.find({ testId: { $in: testIds } }).lean();

  const analytics = {
    totalTests: tests.length,
    totalSubmissions: submissions.length,
    avgScore:
      submissions.length > 0
        ? (submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length).toFixed(2)
        : 0,
    feedbackGenerated: submissions.filter(s => s.feedback && s.feedback !== "").length,
  };

  return NextResponse.json(analytics);
}
