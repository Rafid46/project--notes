"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none pointer-events-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-between p-8 sm:p-10 bg-card">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Welcome to Notes
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Continue with Google to access your workspace. New and returning
              accounts connect seamlessly with one click.
            </p>
          </div>

          <div className="my-8 flex flex-col gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || !clerk.loaded}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl border border-border bg-background hover:bg-muted/80 text-foreground font-medium text-sm transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>

        <div className="hidden md:flex p-3 bg-muted/20 items-center justify-center">
          <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-inner">
            <svg
              viewBox="0 0 400 480"
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full object-cover"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FDECDA" />
                  <stop offset="25%" stopColor="#F9C6B3" />
                  <stop offset="50%" stopColor="#EAA7A3" />
                  <stop offset="75%" stopColor="#B49DBE" />
                  <stop offset="100%" stopColor="#7D688D" />
                </linearGradient>

                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="35%" stopColor="#FFF2D6" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#FDDDB0" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FDECDA" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EDE6F4" />
                  <stop offset="50%" stopColor="#D9D0E4" />
                  <stop offset="100%" stopColor="#BCB1CC" />
                </linearGradient>
              </defs>

              <rect width="400" height="480" fill="url(#skyGrad)" />

              <circle cx="270" cy="170" r="85" fill="url(#sunGlow)" />
              <circle cx="270" cy="170" r="42" fill="#FFFBF2" />

              <path
                d="M-20,290 Q90,260 210,285 T420,270 L420,480 L-20,480 Z"
                fill="#8A637C"
                opacity="0.85"
              />
              <path
                d="M-20,305 Q80,285 240,305 T420,290 L420,480 L-20,480 Z"
                fill="#614A66"
                opacity="0.9"
              />

              <path
                d="M420,240 Q350,230 300,250 Q240,275 220,320 L420,350 Z"
                fill="#EDE5F5"
              />
              <path
                d="M420,245 Q350,235 305,255 L300,265 Q350,245 420,255 Z"
                fill="#B8A7C6"
              />

              <g transform="translate(315, 205)">
                <path d="M0,45 A25,25 0 0,1 50,45 Z" fill="#2A2433" />
                <line
                  x1="25"
                  y1="45"
                  x2="25"
                  y2="20"
                  stroke="#EDE5F5"
                  strokeWidth="2"
                />
                <line
                  x1="12"
                  y1="45"
                  x2="16"
                  y2="23"
                  stroke="#EDE5F5"
                  strokeWidth="2"
                />
                <line
                  x1="38"
                  y1="45"
                  x2="34"
                  y2="23"
                  stroke="#EDE5F5"
                  strokeWidth="2"
                />
              </g>

              <g transform="translate(345, 185) scale(0.7)">
                <path
                  d="M10,60 Q12,30 25,10"
                  stroke="#2A2433"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle cx="25" cy="10" r="3.5" fill="#2A2433" />
                <path
                  d="M11,45 Q25,35 35,25"
                  stroke="#2A2433"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="35" cy="25" r="3" fill="#2A2433" />
                <path
                  d="M9,50 Q-5,40 -12,30"
                  stroke="#2A2433"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="-12" cy="30" r="3" fill="#2A2433" />
              </g>

              <path
                d="M-20,340 Q120,320 260,345 Q360,360 420,345 L420,480 L-20,480 Z"
                fill="url(#snowGrad)"
              />

              <path
                d="M-20,390 Q140,365 290,385 T420,380 L420,480 L-20,480 Z"
                fill="#D4CAE2"
                opacity="0.8"
              />

              <g transform="translate(230, 345) scale(0.85)">
                <path
                  d="M15,100 L15,10"
                  stroke="#2A2233"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,70 Q-5,50 -10,35"
                  stroke="#2A2233"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M-10,35 Q-15,25 -20,20"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M-10,35 Q-5,25 -5,15"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,55 Q35,40 40,25"
                  stroke="#2A2233"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M40,25 Q45,15 50,10"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M40,25 Q35,15 32,5"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,35 Q5,20 0,5"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,25 Q25,12 28,0"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              <g transform="translate(340, 335) scale(0.95)">
                <path
                  d="M15,110 L15,10"
                  stroke="#2A2233"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,80 Q-5,60 -12,45"
                  stroke="#2A2233"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M-12,45 Q-20,35 -22,25"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,65 Q35,50 42,35"
                  stroke="#2A2233"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M42,35 Q48,25 52,15"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,40 Q2,25 -2,10"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,30 Q28,15 30,-5"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              <g transform="translate(60, 360) scale(0.7)">
                <path
                  d="M15,110 L15,10"
                  stroke="#2A2233"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,75 Q-5,55 -10,40"
                  stroke="#2A2233"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,60 Q35,45 38,30"
                  stroke="#2A2233"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,35 Q5,20 2,5"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M15,25 Q25,10 27,0"
                  stroke="#2A2233"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
