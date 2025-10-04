import { apiClient } from "@/lib/api-client";
import type { TransactionsListResponse, TransactionsQuery } from "@/types/transactions";

const DEFAULT_LIMIT = 25;

export async function fetchTransactions(params: TransactionsQuery = {}): Promise<TransactionsListResponse> {
  const response = await apiClient.get<TransactionsListResponse>("/transactions", {
    params: {
      limit: params.limit ?? DEFAULT_LIMIT,
      offset: params.offset ?? 0,
      user_id: params.user_id || undefined,
      type: params.type || undefined,
      payment_method: params.payment_method || undefined,
      is_completed: params.is_completed,
      status: params.status || undefined,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
      amount_min: params.amount_min || undefined,
      amount_max: params.amount_max || undefined,
      currency: params.currency || undefined,
    },
  });
  return response.data;
}
