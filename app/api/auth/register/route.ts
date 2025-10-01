// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import User from "@/models/User";
import { hashPassword, signToken, createSessionCookie } from "@/lib/auth";

type Payload = {
  name?: string;
  email?: string;
  password?: string;
  role?: "student" | "teacher";
  expertise?: string; // comma-separated from client
  bio?: string;
  interests?: string; // comma-separated from client
};

function splitToArray(s?: string) {
  if (!s) return undefined;
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const role = body.role === "teacher" ? "teacher" : "student";

    if (!password || typeof password !== "string" || password.length <= 6) {
      return NextResponse.json(
        { error: "Password must be at least 7 characters." },
        { status: 400 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check duplicate
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Role-specific validation
    let expertiseArray: string[] | undefined = undefined;
    let interestsArray: string[] | undefined = undefined;
    let bio = body.bio?.trim() ?? "";

    if (role === "teacher") {
      expertiseArray = splitToArray(body.expertise);
      if (!expertiseArray || expertiseArray.length === 0) {
        return NextResponse.json(
          { error: "Please provide at least one expertise/subject." },
          { status: 400 }
        );
      }
      if (!bio || bio.length < 20) {
        return NextResponse.json(
          { error: "Please provide a short bio (at least 20 characters)." },
          { status: 400 }
        );
      }
    } else {
      // student
      interestsArray = splitToArray(body.interests) ?? undefined;
    }

    // Hash password
    const hashed = await hashPassword(password);
    if (!hashed || typeof hashed !== "string") {
      console.error("ERROR: hashPassword returned invalid value", hashed);
      return NextResponse.json(
        { error: "Internal server error (hash)" },
        { status: 500 }
      );
    }

    // Create user document
    const newUser = new User({
      name,
      email,
      password: hashed,
      role,
      ...(expertiseArray ? { expertise: expertiseArray } : {}),
      ...(bio ? { bio } : {}),
      ...(interestsArray ? { interests: interestsArray } : {}),
    });

    const savedUser = (await newUser.save()) as typeof newUser & {
      _id: string;
    };

    // Create JWT & cookie
    const token = signToken({
      sub: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
    });
    const cookie = createSessionCookie(token);

    // prepare response without password
    const userResponse = {
      id: savedUser._id.toString(),
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      expertise: savedUser.expertise,
      bio: savedUser.bio,
      interests: savedUser.interests,
      createdAt: savedUser.createdAt,
    };

    const res = NextResponse.json({ user: userResponse });
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (err: any) {
    console.error("Signup error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
