'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, Loader2, ShieldCheck, KeyRound } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const error = searchParams.get('error');

  const [totpEmail, setTotpEmail] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);

  const errorMessages: Record<string, string> = {
    OAuthSignin: 'Could not start the sign-in flow with the provider.',
    OAuthCallback: 'There was a problem during sign-in. Please try again.',
    OAuthCreateAccount: 'Could not create an account with the provider.',
    EmailCreateAccount: 'Could not create an account.',
    Callback: 'Sign-in callback failed. Please try again.',
    AccessDenied: 'Access was denied. You may not have permission to sign in.',
    Configuration: 'Authentication is not configured correctly.',
    Verification: 'The sign-in link is invalid or has expired.',
    CredentialsSignin: 'Invalid authenticator code or email. Please try again.',
    default: 'An unexpected error occurred during sign-in.',
  };

  const errorMessage = error ? errorMessages[error] ?? errorMessages.default : null;

  const handleTotpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpEmail.trim() || totpCode.length !== 6) {
      setTotpError('Please enter your email and the 6-digit code.');
      return;
    }
    setTotpLoading(true);
    setTotpError(null);

    const result = await signIn('credentials', {
      email: totpEmail,
      code: totpCode,
      redirect: false,
      callbackUrl,
    });

    setTotpLoading(false);

    if (result?.error) {
      setTotpError('Invalid email or authenticator code. Please try again.');
    } else if (result?.ok && result.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-6" />
          </div>
          <CardTitle className="text-2xl">Sign in to Fiscal Flow</CardTitle>
          <CardDescription>Choose how you want to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {errorMessage ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {/* Google OAuth section */}
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => signIn('google', { callbackUrl })}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* TOTP / Google Authenticator section */}
          <form onSubmit={handleTotpLogin} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="size-4" />
              <span>Sign in with Google Authenticator</span>
            </div>

            {totpError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {totpError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="totp-email">Email</Label>
              <Input
                id="totp-email"
                type="email"
                placeholder="you@example.com"
                value={totpEmail}
                onChange={(e) => setTotpEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totp-code">6-digit authenticator code</Label>
              <Input
                id="totp-code"
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={totpLoading}>
              {totpLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 size-4" />
              )}
              Verify &amp; Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            By signing in you agree to access your personal expense tracker.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
