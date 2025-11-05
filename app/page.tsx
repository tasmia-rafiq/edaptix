import { getCurrentUser } from "@/lib/session";
import Image from "next/image";
import Link from "next/link";
import { connectToDatabase } from "@/lib/database";
import Course from "@/models/Course";
import { Play } from "lucide-react";
import User from "@/models/User";

export default async function HomePage() {
  const session = await getCurrentUser();
  return (
    <main>
      <Hero session={session} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Stats />

        <div className="my-12">
          <FeaturedCourses />
        </div>

        <div className="my-12">
          <PopularCourses />
        </div>

        <div className="my-12">
          <TopInstructors />
        </div>

        <hr className="border-slate-300" />

        <Features session={session} />
      </div>
    </main>
  );
}

function Hero({ session }: { session: any }) {
  return (
    <section className="bg-gradient-to-tr from-indigo to-teal text-white h-[100vh] overflow-hidden flex items-center justify-between">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Learn smarter. Teach better. Grow faster.
            </h1>
            <p className="text-lg sm:text-xl text-sky-100/90 max-w-2xl">
              Edaptix connects teachers and students with tools for live
              lessons, recorded courses, customizable assessments and
              AI-assisted grading — so students get personalized help and
              teachers spend less time on admin and more on teaching.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
              <Link
                href={session ? "/dashboard" : "signup"}
                className="primary_btn hover:!bg-transparent hover:!text-white"
              >
                Get started (students)
              </Link>

              <Link
                href={session ? "/dashboard" : "signup"}
                className="primary_btn !bg-indigo !border-indigo hover:!bg-transparent hover:!text-white"
                aria-label="Sign up as teacher"
              >
                I want to teach
              </Link>
            </div>
          </div>

          {/* Right: illustrative card */}
          <div className="relative">
            <div className="rounded-2xl bg-white/5 p-6 shadow-xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-white/90">Course</div>
                  <div className="text-lg font-semibold">
                    Introduction to Data Structures
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">By</div>
                  <div className="font-medium">Jane Doe</div>
                </div>
              </div>

              <div className="bg-indigo rounded-lg p-4">
                <Image
                  src="https://thedigitaladda.com/wp-content/uploads/Data-Structure-Algorithms.png"
                  alt="Course screenshot"
                  width={720}
                  height={420}
                  className="rounded"
                />
                <div className="mt-3 flex justify-between items-center">
                  <div className="text-sm text-white">
                    8 lessons • 2 assessments
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-teal text-white rounded-md"
                >
                  Enroll
                </Link>
                <Link
                  href="/signin"
                  className="px-4 py-2 border rounded-md text-white/90"
                >
                  Preview
                </Link>
              </div>
            </div>

            {/* subtle highlight */}
            <div className="absolute -right-6 -bottom-6 w-60 h-60 rounded-full bg-indigo-400 opacity-30 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

const stats = [
  { label: "Students learning", value: "12k+" },
  { label: "Courses created", value: "1.8k" },
  { label: "Teachers", value: "850+" },
  { label: "AI-graded assessments", value: "100k+" },
];

function Stats() {
  return (
    <section className="mt-12 mb-8">
      <div className="rounded-lg bg-slate-100 shadow px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-semibold text-slate-800">
                {s.value}
              </div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const studentFeatures = [
  {
    title: "Interactive lessons",
    desc: "Recordings, live sessions, checkpoints and inline quizzes — stay engaged and retain more.",
    icon: "book",
  },
  {
    title: "AI-assisted grading",
    desc: "Instant, explainable feedback and targeted practice recommendations after each assessment.",
    icon: "spark",
  },
  {
    title: "Progress tracking with AI",
    desc: "Auto-generated study paths, strengths/weaknesses dashboard and streaks to keep you motivated.",
    icon: "chart",
  },
];

const teacherFeatures = [
  {
    title: "Create courses & tests",
    desc: "Drag-and-drop lessons, rich media, and assessments — publish in minutes.",
    icon: "edit",
  },
  {
    title: "Automated grading",
    desc: "Auto-grade objective assessments and export results to CSV for analysis.",
    icon: "auto",
  },
  {
    title: "Monetize & manage students",
    desc: "Set course pricing, manage enrollments and access analytics in one place.",
    icon: "wallet",
  },
];

function Icon({ name }: { name: string }) {
  const common = "w-6 h-6 flex-none";
  switch (name) {
    case "book":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 6a2 2 0 0 1 2-2h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 18v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.93 4.93l2.83 2.83"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.24 16.24l2.83 2.83"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 12h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.93 19.07l2.83-2.83"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.24 7.76l2.83-2.83"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "chart":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 3v18h18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 13v5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7v11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 10v8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "edit":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 21l3-1 11-11a2.828 2.828 0 0 0 0-4l-2-2a2.828 2.828 0 0 0-4 0L6 13 5 16 3 21z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "auto":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2v6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 12h-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 12h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 22v-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "wallet":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M2 7h18v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 11v2"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-600 ring-1 ring-slate-100">
          <Icon name={icon} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-md font-semibold text-slate-800">{title}</h4>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-400">Included</div>
        <div className="text-xs text-slate-600 font-medium">Core feature</div>
      </div>

      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
          <circle cx="20" cy="20" r="20" fill="rgba(59,130,246,0.06)"></circle>
        </svg>
      </div>
    </div>
  );
}

function Features({ session }: { session: any }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Large student panel (span 7 cols on lg) */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 p-8 border border-slate-200 shadow-md">
            <div className="flex flex-col items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Designed for students — learning that actually works
                </h2>
                <p className="mt-3 text-slate-500 max-w-2xl">
                  Bite-sized lessons, interactive quizzes and AI feedback create
                  a continuous learning loop so you improve faster.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href={session ? "/dashboard" : "/signin"}
                  className="primary_btn"
                >
                  Get started
                </Link>
                <Link href="/courses" className="primary_btn white_btn">
                  Browse courses
                </Link>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4">
              {studentFeatures.map((f) => (
                <FeatureCard
                  key={f.title}
                  title={f.title}
                  desc={f.desc}
                  icon={f.icon}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: teacher column (span 5 cols on lg) */}
        <aside className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    For teachers
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Create courses, assessments and grow your classes.
                  </p>
                </div>

                <Link href="/signup" className="primary_btn white_btn !text-sm">
                  Start teaching
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {teacherFeatures.map((t) => (
                  <div
                    key={t.title}
                    className="flex gap-3 items-start p-3 rounded-lg border border-slate-100 hover:shadow-sm transition bg-white"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                      <Icon name={t.icon} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">
                        {t.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {t.desc}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">Pro</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href="/dashboard/create-test"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo text-white"
                >
                  Create test
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 inline-flex items-center justify-center primary_btn white_btn"
                >
                  Dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="text-sm font-semibold text-emerald-800">
                Why teachers love Edaptix
              </div>
              <ul className="mt-3 text-sm text-emerald-700 space-y-2">
                <li>• Save time with auto-grading</li>
                <li>• Powerful insights on student gaps</li>
                <li>• Simple course & test management</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function minutesToHuman(mins?: number | null) {
  if (!mins || mins <= 0) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

async function FeaturedCourses() {
  await connectToDatabase();

  // Get latest published courses (limit 4)
  const courses = await Course.find({ published: true })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  if (!courses || courses.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Featured courses</h2>
          <p className="text-sm text-slate-500">New and noteworthy from our instructors.</p>
        </div>
        <Link href="/courses" className="text-sm px-3 py-1 rounded-md border border-slate-200">Browse all courses</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((c: any) => {
          const lessonCount = Array.isArray(c.lessons) ? c.lessons.length : 0;
          return (
            <article key={String(c._id)} className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
              <div className="h-40 bg-slate-100 overflow-hidden">
                {c.coverImage ? (
                  <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No cover</div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{c.title}</h3>
                {c.subtitle && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{c.subtitle}</div>}

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <Play size={12} /> <span>{lessonCount} lesson{lessonCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div>{minutesToHuman(c.estimatedDuration)}</div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link href={`/courses/${c._id}`} className="px-3 py-1.5 rounded-md bg-indigo text-white text-sm">View</Link>
                  <Link href={`/dashboard/courses/${c._id}/enroll`} className="px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700">Enroll</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

async function PopularCourses() {
  await connectToDatabase();

  // naive popularity: try to compute by number of submissions to tests in course lessons (if you have submissions)
  // fallback: sort by lesson count
  const courses = await Course.find({ published: true }).lean();

  if (!courses || courses.length === 0) return null;

  // quick heuristic: score = lessons.length + enrollmentsCount (if you store) or 0.
  // If you have an enrollments collection, replace the heuristic with proper aggregation.
  const scored = courses.map((c: any) => {
    const lessons = Array.isArray(c.lessons) ? c.lessons.length : 0;
    const score = lessons;
    return { course: c, score };
  });

  scored.sort((a: any, b: any) => b.score - a.score);

  const top = scored.slice(0, 6).map((s: any) => s.course);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Popular courses</h2>
          <p className="text-sm text-slate-500">Learners are loving these right now.</p>
        </div>
        <Link href="/courses" className="text-sm px-3 py-1 rounded-md border border-slate-200">See all</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {top.map((c: any) => (
          <div key={c._id} className="rounded-xl border border-slate-100 p-4 bg-white shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden">
                {c.coverImage ? <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">No cover</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{c.title}</h3>
                <div className="text-xs text-slate-500 mt-1">{c.subtitle ?? ""}</div>
                <div className="mt-3 flex items-center gap-2">
                  <Link href={`/courses/${c._id}`} className="text-sm px-3 py-1 rounded-md bg-indigo text-white">Open</Link>
                  <Link href={`/dashboard/courses/${c._id}/enroll`} className="text-sm px-3 py-1 rounded-md border border-slate-200">Enroll</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


async function TopInstructors() {
  await connectToDatabase();

  // fetch teachers who have published courses (limit 6)
  const agg = await Course.aggregate([
    { $match: { published: true } },
    { $group: { _id: "$createdBy", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]);

  const teacherIds = agg.map((a: any) => a._id).filter(Boolean);

  if (teacherIds.length === 0) return null;

  const users = await User.find({ _id: { $in: teacherIds } }).select("name avatar bio").lean();

  if (!users || users.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Top instructors</h2>
          <p className="text-sm text-slate-500">Get learning from experienced teachers.</p>
        </div>
        <Link href="/teachers" className="text-sm px-3 py-1 rounded-md border border-slate-200">See all instructors</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {users.map((u: any) => (
          <div key={String(u._id)} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
              {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">{u.name?.[0]}</div>}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">{u.name}</div>
              <div className="text-xs text-slate-500 mt-1 line-clamp-2">{u.bio ?? ""}</div>
            </div>
            <Link href={`/teachers/${u._id}`} className="text-sm px-3 py-1 rounded-md border border-slate-200">View</Link>
          </div>
        ))}
      </div>
    </section>
  );
}