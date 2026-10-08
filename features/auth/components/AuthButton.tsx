"use client";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";
import { useAppUser } from "@/providers/UserProvider";
import Image from "next/image";

export default function AuthButton() {
  const { isLoaded, isSignedIn, initialUser } = useAppUser();

  // If server says we have a user but Clerk is still loading, show the server-rendered avatar
  if (!isLoaded && initialUser) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none overflow-hidden border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Image
          width={40}
          height={40}
          src={initialUser.imageUrl}
          alt="User Profile"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (!isLoaded && !isSignedIn) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs">
        <User size={18} />
      </div>
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
