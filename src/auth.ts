import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import * as otpauth from "otpauth";

const ALLOWED_EMAILS = new Set(
  (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function getTotpSecret(): string {
  const secret = process.env.TOTP_SECRET;
  if (!secret) {
    throw new Error("TOTP_SECRET environment variable is not set");
  }
  return secret;
}

function verifyTotpCode(code: string): boolean {
  try {
    const totp = new otpauth.TOTP({
      issuer: "Fiscal Flow",
      label: process.env.TOTP_EMAIL || "user",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: otpauth.Secret.fromBase32(getTotpSecret()),
    });

    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Authenticator",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Authenticator Code", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string || "").toLowerCase().trim();
        const code = (credentials?.code as string || "").trim();

        if (!email || !code) return null;

        // Check email allowlist
        if (ALLOWED_EMAILS.size > 0 && !ALLOWED_EMAILS.has(email)) {
          console.warn(`Unauthorized TOTP login attempt by: ${email}`);
          return null;
        }

        // Verify the TOTP code against the shared secret
        if (!verifyTotpCode(code)) {
          return null;
        }

        const totpEmail = process.env.TOTP_EMAIL || email;
        return {
          id: totpEmail,
          email: totpEmail,
          name: totpEmail.split("@")[0],
        };
      },
    }),
  ],
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Only apply the allowlist to Google logins
      if (account?.provider === "google") {
        const email = (user.email || "").toLowerCase();
        if (!email) return false;

        // If no allowlist is configured, allow all verified Google users
        if (ALLOWED_EMAILS.size === 0) return true;

        if (!ALLOWED_EMAILS.has(email)) {
          console.warn(`Unauthorized login attempt by: ${email}`);
          return false;
        }
      }
      return true;
    },
    authorized: ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" ||
        pathname === "/setup-totp" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/totp") ||
        pathname.startsWith("/auth/callback") ||
        pathname.includes(".");
      return !!auth || isPublic;
    },
  },
});
