"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

import { GoogleLogo } from "./google-logo";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// Inner component — only rendered when GoogleOAuthProvider is present
function ConfiguredButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    console.log("[google-sign-in] credentialResponse:", credentialResponse);
    const idToken = credentialResponse.credential;
    if (!idToken) {
      console.error("[google-sign-in] credential missing from response");
      setError("Sign-in failed: id_token not returned by Google.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id_token: idToken }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("[google-sign-in] verify failed:", res.status, body);
        setError(`Sign-in failed: ${body?.detail ?? res.statusText}`);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      console.error("[google-sign-in] fetch error:", err);
      setError("Sign-in failed. Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    console.error("[google-sign-in] GoogleLogin error");
    setError("Sign-in was cancelled or blocked by the browser.");
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {loading ? (
        <div className="inline-flex h-10 cursor-not-allowed items-center gap-2.5 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground opacity-50">
          <span className="size-[18px] animate-spin rounded-full border-2 border-border border-t-foreground" />
          Signing in...
        </div>
      ) : (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          text="continue_with"
          shape="rectangular"
          theme="outline"
          size="large"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function GoogleSignInButton() {
  if (!googleClientId) {
    return (
      <button
        type="button"
        disabled
        title="Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local"
        className="inline-flex h-10 cursor-not-allowed items-center gap-2.5 rounded-md border-hair border-border bg-background px-5 text-sm font-medium text-foreground opacity-40"
      >
        <GoogleLogo className="size-[18px] shrink-0" />
        Continue with Google
      </button>
    );
  }

  return <ConfiguredButton />;
}
