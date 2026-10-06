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
      const response = await api.post(USERS.login, userData);
      return response.data;
    },
    retry: 1,
    onError: (error) => {
      console.error("Failed to save user to backend", error);
    },
  });

  const { mutate } = mutation;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      attemptedUserId.current = null;
      return;
    }

    if (!user || attemptedUserId.current === user.id) return;

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
