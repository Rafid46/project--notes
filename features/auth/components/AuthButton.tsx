"use client";
import { UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";
import { useAppUser } from "@/providers/UserProvider";

export default function AuthButton() {
  const { isLoaded, isSignedIn } = useAppUser();

  if (!isLoaded) {
    return (
      <div className="h-10 w-10 rounded-full bg-secondary animate-pulse shrink-0 border border-border" />
    );
  }

  if (isSignedIn) {
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
    <div
      aria-label="User Profile"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs"
    >
      <User size={18} />
    </div>
  );
}
