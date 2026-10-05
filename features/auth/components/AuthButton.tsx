"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { User } from "lucide-react";

export default function AuthButton() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs">
        <User size={18} />
      </div>
    );
  }

  if (userId) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-10 w-10",
            },
          }}
        />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        aria-label="Sign In"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
      >
        <User size={18} />
      </button>
    </SignInButton>
  );
}
