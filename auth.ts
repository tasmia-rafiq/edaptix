import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/database";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) return false;

      await connectToDatabase();

      const existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        await User.insertOne({
          name: user.name,
          email: user.email,
          image: user.image,
          provider: account?.provider,
          providerId: (profile as any)?.sub ?? undefined,
          user_role: user.user_role,
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });

        token.id = dbUser?._id.toString();
        token.user_role = dbUser.user_role;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        (session as any).id = token.id;
        (session as any).user_role = token.user_role ?? "student";
      }
      return session;
    },
  },
});
