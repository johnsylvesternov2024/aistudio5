import { NextResponse } from "next/server";
import * as otpauth from "otpauth";
import * as crypto from "crypto";

function generateBase32Secret(): string {
  // 20 bytes -> 32 base32 chars, standard for TOTP
  const bytes = crypto.randomBytes(20);
  return bytes.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_").toUpperCase().slice(0, 32);
}

export async function GET() {
  try {
    // If a secret is already configured, return it so the page can show the QR
    const existing = process.env.TOTP_SECRET;
    if (existing) {
      const totp = new otpauth.TOTP({
        issuer: "Fiscal Flow",
        label: process.env.TOTP_EMAIL || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: otpauth.Secret.fromBase32(existing),
      });
      return NextResponse.json({
        secret: existing,
        otpauthUrl: totp.toString(),
        configured: true,
      });
    }

    // Generate a new secret for setup
    const secret = generateBase32Secret();
    const totp = new otpauth.TOTP({
      issuer: "Fiscal Flow",
      label: process.env.TOTP_EMAIL || "user",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: otpauth.Secret.fromBase32(secret),
    });
    return NextResponse.json({
      secret,
      otpauthUrl: totp.toString(),
      configured: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate TOTP setup" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { code, secret } = await request.json();

    if (!code || !secret) {
      return NextResponse.json({ error: "Code and secret are required" }, { status: 400 });
    }

    const totp = new otpauth.TOTP({
      issuer: "Fiscal Flow",
      label: process.env.TOTP_EMAIL || "user",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: otpauth.Secret.fromBase32(secret),
    });

    const delta = totp.validate({ token: String(code), window: 1 });
    if (delta === null) {
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
    }

    // Verification succeeded — the secret is valid.
    // The user must persist this as TOTP_SECRET in their hosting environment.
    return NextResponse.json({
      success: true,
      secret,
      message: "Verified. Save this secret as TOTP_SECRET in your environment variables.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 },
    );
  }
}
