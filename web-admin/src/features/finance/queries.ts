import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchTransactions } from "@/features/finance/api";
import type { TransactionsListResponse, TransactionsQuery } from "@/types/transactions";

const TRANSACTIONS_QUERY_KEY = ["finance", "transactions"];

export function useTransactionsList(initial: TransactionsQuery = {}) {
  const [params, setParams] = useState<TransactionsQuery>({ limit: 25, offset: 0, ...initial });

  const query = useQuery<TransactionsListResponse, Error>({
    queryKey: [...TRANSACTIONS_QUERY_KEY, params],
    queryFn: () => fetchTransactions(params),
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  });

  return {
    ...query,
    params,
    setParams,
  };
}
