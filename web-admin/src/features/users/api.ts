import { apiClient } from "@/lib/api-client";
import type {
  BalanceUpdatePayload,
  User,
  UserUpdatePayload,
  UsersListQuery,
  UsersListResponse,
} from "@/types/users";

const DEFAULT_LIMIT = 20;

export async function fetchUsers(params: UsersListQuery = {}): Promise<UsersListResponse> {
  const response = await apiClient.get<UsersListResponse>("/users", {
    params: {
      limit: params.limit ?? DEFAULT_LIMIT,
      offset: params.offset ?? 0,
      search: params.search || undefined,
      status: params.status || undefined,
      promo_group_id: params.promo_group_id || undefined,
    },
  });
  return response.data;
}

export async function fetchUser(userId: number): Promise<User> {
  const response = await apiClient.get<User>(`/users/${userId}`);
  return response.data;
}

export async function updateUser(userId: number, payload: UserUpdatePayload): Promise<User> {
  const response = await apiClient.patch<User>(`/users/${userId}`, payload);
  return response.data;
}

export async function adjustUserBalance(
  userId: number,
  payload: BalanceUpdatePayload,
): Promise<User> {
  const response = await apiClient.post<User>(`/users/${userId}/balance`, {
    amount_kopeks: Math.round(payload.amount_rubles * 100),
    description: payload.description,
    create_transaction: payload.create_transaction ?? true,
  });
  return response.data;
}
