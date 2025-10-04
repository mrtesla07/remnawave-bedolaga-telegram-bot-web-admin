import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { TicketDto, TicketListQuery, TicketPriority, TicketStatus } from "./api";
import { clearReplyBlock, fetchTicket, fetchTickets, replyToTicket, setReplyBlock, updateTicketPriority, updateTicketStatus } from "./api";

const TICKETS_KEY = ["tickets"] as const;

export function useTicketsList(initial: TicketListQuery = {}) {
  const [params, setParams] = useState<TicketListQuery>({ limit: 25, offset: 0, ...initial });
  const query = useQuery<TicketDto[]>({
    queryKey: [...TICKETS_KEY, "list", params],
    queryFn: () => fetchTickets(params),
    keepPreviousData: true,
  });
  return { ...query, params, setParams };
}

export function useTicketDetails(id: number | null) {
  return useQuery<TicketDto>({
    queryKey: [...TICKETS_KEY, "detail", id],
    queryFn: () => (id ? fetchTicket(id) : Promise.reject("no id")),
    enabled: Boolean(id),
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) => updateTicketStatus(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY, "list"] });
      qc.setQueryData([...TICKETS_KEY, "detail", data.id], data);
    },
  });
}

export function useUpdateTicketPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }: { id: number; priority: TicketPriority }) => updateTicketPriority(id, priority),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY, "list"] });
      qc.setQueryData([...TICKETS_KEY, "detail", data.id], data);
    },
  });
}

export function useSetReplyBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permanent, until }: { id: number; permanent: boolean; until?: string | null }) => setReplyBlock(id, permanent, until),
    onSuccess: (data) => {
      qc.setQueryData([...TICKETS_KEY, "detail", data.id], data);
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY, "list"] });
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY] });
    },
  });
}

export function useClearReplyBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clearReplyBlock(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY, "detail", id] });
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY, "list"] });
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY] });
    },
  });
}

export function useReplyToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message: { message_text: string; media_type?: string | null; media_file_id?: string | null; media_caption?: string | null } }) => replyToTicket(id, message),
    onSuccess: (data) => {
      qc.setQueryData([...TICKETS_KEY, "detail", data.id], data);
      // Обновляем списки, так как сортировка и updated_at меняются
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY, "list"] });
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY] });
    },
  });
}


