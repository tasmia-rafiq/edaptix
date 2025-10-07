import Link from "next/link";
import { User2Icon } from "lucide-react";
import Image from "next/image";
import { getCurrentUser } from "@/lib/session";
import LogoutButton from "./LogoutBtn";

const Header = async () => {
  let session = null;

  try {
    session = await getCurrentUser();
  } catch (error) {
    console.error("Auth error in Header:", error);
    // Continue rendering without session if auth fails
  }

  return (
    <header className="px-5 py-3 bg-white shadow-md font-poppins">
      <nav className="flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={200} height={100} />
        </Link>

        {/* RENDERING THE BELOW BASED ON IF USER IS LOGGED IN OR NOT */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-5">
            <Link href={"/"} className="nav-menu">
              Home
            </Link>
          </div>
          {session && session?._id ? (
            <>
            {/* FOR TEACHERS */}
              {session?.role === "teacher" ? (
                <Link href={"/dashboard/courses"}>My Courses</Link>
              ) : (
                <Link href={"/courses"}>Courses</Link>
              )}

              <Link
                href={"/dashboard"}
                className="!text-[16px] !bg-white !text-black-100 flex items-center gap-2"
              >
                Dashboard
              </Link>

              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href={"/signup"}
                className="primary_btn"
              >
                <span>Sign Up</span>
              </Link>
              <Link
                href={"/signin"}
                className="primary_btn white_btn"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
