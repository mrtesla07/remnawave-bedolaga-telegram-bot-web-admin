export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "subscription_payment"
  | "refund"
  | "referral_reward";

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType | string;
  amount_kopeks: number;
  amount_rubles: number;
  description?: string | null;
  payment_method?: string | null;
  external_id?: string | null;
  currency?: string | null;
  status?: string | null;
  is_completed: boolean;
  created_at: string;
  completed_at?: string | null;
}

export interface TransactionsListResponse {
  items: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface TransactionsQuery {
  limit?: number;
  offset?: number;
  user_id?: number;
  type?: string;
  payment_method?: string;
  is_completed?: boolean;
  status?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  currency?: string;
}
