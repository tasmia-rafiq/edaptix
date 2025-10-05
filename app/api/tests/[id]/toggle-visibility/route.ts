import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import Test from "@/models/Test";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const test = await Test.findById(params.id);
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // permission: only test creator or teacher role can toggle
  const viewerId = (user as any).id ?? (user as any)._id;
  if (String(test.createdBy) !== String(viewerId) && (user as any).role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.formData();
  const current = String(data.get("current") ?? (test.visibility ?? "private"));

  const next = current === "public" ? "private" : "public";
  test.visibility = next;
  await test.save();

  const referer = req.headers.get("referer") ?? "/dashboard";
  return NextResponse.redirect(referer);
}