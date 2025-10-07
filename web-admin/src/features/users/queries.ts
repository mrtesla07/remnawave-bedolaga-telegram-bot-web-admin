import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adjustUserBalance, fetchUser, fetchUsers, updateUser } from "./api";
import type {
  BalanceUpdatePayload,
  User,
  UserUpdatePayload,
  UsersListQuery,
  UsersListResponse,
} from "@/types/users";

const USERS_QUERY_KEY = ["users", "list"];

export function useUsersList(initialParams: UsersListQuery = {}) {
  const [params, setParams] = useState<UsersListQuery>(initialParams);

  const query = useQuery<UsersListResponse, Error>({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: () => fetchUsers(params),
    placeholderData: (previous) => previous,
  });

  return {
    ...query,
    params,
    setParams,
  };
}

export function useUserDetails(userId: number | null) {
  return useQuery<User, Error>({
    queryKey: ["users", "detail", userId],
    queryFn: () => (userId ? fetchUser(userId) : Promise.reject("No user")),
    enabled: Boolean(userId),
  });
}

export function useUpdateUser(userId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserUpdatePayload) => {
      if (!userId) {
        throw new Error("User id is not set");
      }
      return updateUser(userId, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.setQueryData(["users", "detail", data.id], data);
    },
  });
}

export function useAdjustUserBalance(userId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BalanceUpdatePayload) => {
      if (!userId) {
        throw new Error("User id is not set");
      }
      return adjustUserBalance(userId, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.setQueryData(["users", "detail", data.id], data);
    },
  });
}
