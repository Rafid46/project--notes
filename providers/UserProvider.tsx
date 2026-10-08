"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

interface UserContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: any | null;
  initialUser?: any | null;
  isSyncing: boolean;
}

const UserContext = createContext<UserContextType>({
  isLoaded: false,
  isSignedIn: false,
  user: null,
  initialUser: null,
  isSyncing: false,
});

export const UserProvider = ({ children, initialUser }: { children: ReactNode; initialUser?: any }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [optimisticAuth, setOptimisticAuth] = useState(false);

  // Syncs the user with the backend automatically
  const { isPending: isSyncing } = useCurrentUser();

  useEffect(() => {
    // If Clerk is still loading on reload, check localStorage for our access token.
    // If it exists, we can optimistically assume the user is signed in to prevent UI flashing.
    if (typeof window !== "undefined" && !isLoaded) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        setOptimisticAuth(true);
      }
    }
  }, [isLoaded]);

  const authenticated = isLoaded ? !!isSignedIn : (!!initialUser || optimisticAuth);

  return (
    <UserContext.Provider
      value={{
        isLoaded,
        isSignedIn: authenticated,
        user: isLoaded ? user : initialUser,
        initialUser,
        isSyncing,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useAppUser = () => useContext(UserContext);
