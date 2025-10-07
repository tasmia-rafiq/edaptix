// app/api/uploads/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // Optional: accept { folder, resource_type } from client to include in params
  const body = await req.json().catch(() => ({}));
  const { folder } = body || {};

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
  }

  // timestamp (in seconds)
  const timestamp = Math.floor(Date.now() / 1000);

  // Build the string to sign. Include folder if provided (and any other stable params).
  // Order matters. For example: "folder=edaptix/courses&timestamp=1234"
  let toSign = `timestamp=${timestamp}`;
  if (folder) {
    toSign = `folder=${String(folder)}&${toSign}`;
  }

  // signature is SHA1(toSign + apiSecret)
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({
    ok: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    // echo back folder for client convenience
    folder: folder ?? null,
  });
}
