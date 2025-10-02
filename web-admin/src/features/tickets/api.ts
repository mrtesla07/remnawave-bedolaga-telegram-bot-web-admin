import { apiClient } from "@/lib/api-client";

export type TicketStatus = "open" | "answered" | "closed" | "pending";
export type TicketPriority = "low" | "normal" | "high" | "urgent" | string;

export interface TicketMessageDto {
  id: number;
  user_id: number;
  message_text: string;
  is_from_admin: boolean;
  has_media: boolean;
  media_type?: string | null;
  media_caption?: string | null;
  created_at: string;
}

export interface TicketDto {
  id: number;
  user_id: number;
  title: string;
  status: TicketStatus | string;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  user_reply_block_permanent: boolean;
  user_reply_block_until?: string | null;
  messages?: TicketMessageDto[];
}

export interface TicketListQuery {
  limit?: number;
  offset?: number;
  status?: TicketStatus;
  priority?: string;
  user_id?: number;
}

export async function fetchTickets(params: TicketListQuery = {}): Promise<TicketDto[]> {
  const { data } = await apiClient.get<TicketDto[]>("/tickets", {
    params: {
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
      status: params.status || undefined,
      priority: params.priority || undefined,
      user_id: params.user_id || undefined,
    },
  });
  return data;
}

export async function fetchTicket(id: number): Promise<TicketDto> {
  const { data } = await apiClient.get<TicketDto>(`/tickets/${id}`);
  return data;
}

export async function updateTicketStatus(id: number, status: TicketStatus): Promise<TicketDto> {
  const { data } = await apiClient.post<TicketDto>(`/tickets/${id}/status`, { status });
  return data;
}

export async function updateTicketPriority(id: number, priority: TicketPriority): Promise<TicketDto> {
  const { data } = await apiClient.post<TicketDto>(`/tickets/${id}/priority`, { priority });
  return data;
}

export async function setReplyBlock(id: number, permanent: boolean, until?: string | null): Promise<TicketDto> {
  const { data } = await apiClient.post<TicketDto>(`/tickets/${id}/reply-block`, { permanent, until: until ?? null });
  return data;
}

export async function clearReplyBlock(id: number): Promise<void> {
  await apiClient.delete(`/tickets/${id}/reply-block`);
}

export async function replyToTicket(id: number, message: { message_text: string; media_type?: string | null; media_file_id?: string | null; media_caption?: string | null }): Promise<TicketDto> {
  const { data } = await apiClient.post<TicketDto>(`/tickets/${id}/reply`, message);
  return data;
}


