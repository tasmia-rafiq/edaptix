import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-tr from-indigo to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:py-20 py-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Link href={"/"} className="inline-block">
            <Image src={logo} alt="Edaptix Logo" className="invert-100 brightness-0" width={260} height={260} />
          </Link>
          <p className="text-sm text-slate-300 mt-2 max-w-sm">
            Teach and learn smarter — assessments, AI feedback, and course tools in one place.
          </p>
        </div>

        <div className="flex gap-20">
          <div>
            <h4 className="text-2xl font-semibold mb-2">Product</h4>
            <ul className="space-y-2 text-lg text-slate-300">
              <li><Link href="/course">Courses</Link></li>
              <li><Link href="/signup">Sign up</Link></li>
              <li><Link href="/signin">Sign in</Link></li>
              <li><Link href="/about">How it works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-2xl font-semibold mb-2">Resources</h4>
            <ul className="space-y-2 text-lg text-slate-300">
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/help">Help center</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-slate-400 flex items-center justify-center">
          <div>© {new Date().getFullYear()} Edaptix. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
