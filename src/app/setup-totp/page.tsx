'use client';

import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldCheck, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

function SetupTotpContent() {
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/totp/setup')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSecret(data.secret);
          setOtpauthUrl(data.otpauthUrl);
          setConfigured(data.configured);
          if (data.otpauthUrl) {
            QRCode.toDataURL(data.otpauthUrl, { width: 240, margin: 1 })
              .then(setQrDataUrl)
              .catch(() => setError('Failed to generate QR code'));
          }
        }
      })
      .catch(() => setError('Failed to load TOTP setup'))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async () => {
    if (!code || !secret) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch('/api/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, secret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
      } else {
        setVerified(true);
      }
    } catch {
      setError('Network error during verification');
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-2xl">Set up Google Authenticator</CardTitle>
          <CardDescription>
            {configured
              ? 'Your authenticator is already configured. Scan the QR code again if you need to re-add it.'
              : 'Scan this QR code with Google Authenticator, then verify with a 6-digit code.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {verified ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="size-12 text-green-600" />
                <p className="text-center text-sm">
                  Verified successfully! To finish setup, add this secret as
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">TOTP_SECRET</code>
                  in your hosting environment variables, then redeploy.
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <Label className="text-xs text-muted-foreground">TOTP_SECRET</Label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all text-xs">{secret}</code>
                  <Button size="sm" variant="outline" onClick={copySecret}>
                    {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => (window.location.href = '/login')}>
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              {qrDataUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR code for Google Authenticator" className="size-60 rounded-lg border" />
                </div>
              )}

              {secret && (
                <div className="rounded-md bg-muted p-3">
                  <Label className="text-xs text-muted-foreground">
                    Or enter this code manually
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 break-all text-xs">{secret}</code>
                    <Button size="sm" variant="outline" onClick={copySecret}>
                      {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code">Enter the 6-digit code from your authenticator</Label>
                <Input
                  id="code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>
              <Button className="w-full" onClick={handleVerify} disabled={verifying || code.length !== 6}>
                {verifying ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Verify &amp; Confirm
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupTotpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SetupTotpContent />
    </Suspense>
  );
}
