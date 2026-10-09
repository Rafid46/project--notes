import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import api from "@/lib/axios";
import { USERS } from "@/constants/api.constant";
import { UserData } from "@/types/UserData-types";

export const useCurrentUser = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const attemptedUserId = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (userData: UserData) => {
      try {
        // Try to login first (for existing users)
        const response = await api.post(USERS.login, userData);
        if (response.data.accessToken && response.data.refreshToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("refreshToken", response.data.refreshToken);
          localStorage.setItem("clerkUserId", userData.data.id);
        }
        return response.data;
      } catch (error: any) {
        // If user is not found (404), this is a new user registering
        if (error.response && error.response.status === 404) {
          const createResponse = await api.post(USERS.createUser, userData);
          if (createResponse.data.accessToken && createResponse.data.refreshToken) {
            localStorage.setItem("accessToken", createResponse.data.accessToken);
            localStorage.setItem("refreshToken", createResponse.data.refreshToken);
            localStorage.setItem("clerkUserId", userData.data.id);
          }
          return createResponse.data;
        }
        throw error;
      }
    },
    retry: 1,
    onError: (error) => {
      console.error("Failed to sync user to backend:", error);
    },
  });

  const { mutate } = mutation;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      attemptedUserId.current = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("clerkUserId");
      return;
    }

    if (!user || attemptedUserId.current === user.id) return;

    // Prevent redundant login hits on reload if we already have valid tokens for this user
    const savedUserId = localStorage.getItem("clerkUserId");
    const hasTokens = !!localStorage.getItem("accessToken");
    
    if (savedUserId === user.id && hasTokens) {
      attemptedUserId.current = user.id;
      return;
    }

    if (savedUserId && savedUserId !== user.id) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("clerkUserId");
    }

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;
    attemptedUserId.current = user.id;

    mutate({
      data: {
        id: user.id,
        email_addresses: [{ email_address: email }],
        first_name: user.firstName ?? undefined,
        last_name: user.lastName ?? undefined,
        image_url: user.imageUrl,
      },
    });
  }, [isLoaded, isSignedIn, user, mutate]);

  return mutation;
};
