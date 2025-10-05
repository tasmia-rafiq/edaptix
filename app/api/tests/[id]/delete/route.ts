import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import Submission from "@/models/Submission";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const test = await Test.findById(params.id);
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // permission: only creator or teacher role
  const viewerId = (user as any).id ?? (user as any)._id;
  if (String(test.createdBy) !== String(viewerId) && (user as any).role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Submission.deleteMany({ testId: test._id });

  await Test.deleteOne({ _id: test._id });

  const referer = req.headers.get("referer") ?? "/dashboard";
  return NextResponse.redirect(referer);
}