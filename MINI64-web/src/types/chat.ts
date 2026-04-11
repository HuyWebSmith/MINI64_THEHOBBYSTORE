export type ChatRole = "admin" | "customer";

export type ChatMessage = {
  id: string;
  senderRole: ChatRole;
  senderName: string;
  text: string;
  createdAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
};

export type ChatConversation = {
  id: string;
  customerName: string;
  customerEmail?: string;
  guestSessionId?: string | null;
  status: "open" | "closed";
  lastMessageText: string;
  lastMessageAt: string;
  unreadAdminCount: number;
  unreadCustomerCount: number;
  messages: ChatMessage[];
  isCustomerOnline?: boolean;
  isAdminOnline?: boolean;
  typingRole?: ChatRole | null;
};

export type ChatPresencePayload = {
  conversationId: string;
  isCustomerOnline: boolean;
  isAdminOnline: boolean;
  typingRole: ChatRole | null;
};
