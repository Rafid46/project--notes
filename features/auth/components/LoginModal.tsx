"use client";

import { useState } from "react";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import { Loader2, Sparkles, Layers, FolderOpen } from "lucide-react";

export default function LoginModal() {
  const clerk = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (!clerk.loaded || !clerk.client || isLoading) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to initiate Google sign-in. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 select-none pointer-events-auto">
      <div className="w-full max-w-4xl rounded-3xl border border-border/80 bg-card text-card-foreground shadow-[0_28px_80px_-18px_rgba(0,0,0,0.35)] overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-between p-8 sm:p-10 bg-card">
          <div>
            <div className="mb-8 flex items-center">
              <Image
                src="/assets/hane.png"
                alt="Hane Notes"
                width={92}
                height={36}
                className="h-7 w-auto object-contain rounded-md"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
              Where your thoughts{" "}
              <span className="inline-block rounded-lg bg-[#BBDC12] px-2 py-0.5 text-[#004030]">
                take shape
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Your personal spatial studio to capture ideas, arrange notes on an
              infinite canvas, and organize local folders without friction.
            </p>
          </div>

          <div className="my-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || !clerk.loaded}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-full border border-border bg-background hover:bg-secondary text-foreground font-semibold text-sm transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2
                  size={18}
                  className="animate-spin text-muted-foreground"
                />
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {isLoading ? "Connecting..." : "Continue with Google"}
              </span>
            </button>

            {errorMessage && (
              <p className="text-xs text-destructive text-center">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-5 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Layers size={13} />
              Spatial whiteboard
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FolderOpen size={13} />
              Local folder board
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={13} />
              Instant sync
            </span>
          </div>
        </div>

        <div
          className="hidden md:flex p-8 items-center justify-center border-l border-border/60 bg-secondary/40"
          style={{
            backgroundImage:
              "radial-gradient(var(--dot-color) 1.5px, transparent 1.5px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
            <Image
              src="/assets/login-illustration.png"
              alt="Notes workspace illustration"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-contain drop-shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
