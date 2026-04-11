import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { BellRing, MessagesSquare, UserRound } from "lucide-react";
import PageMeta from "../components/admin_component/common/PageMeta";
import ChatComposer from "../components/chat/ChatComposer";
import ConversationList from "../components/chat/ConversationList";
import MessageBubble from "../components/chat/MessageBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import type { ChatConversation, ChatMessage, ChatPresencePayload } from "../types/chat";

const apiUrl = import.meta.env.VITE_API_URL;

function normalizeConversation(conversation: ChatConversation & { _id?: string }) {
  return {
    ...conversation,
    id: conversation.id || conversation._id || "",
  };
}

function sortConversations(conversations: ChatConversation[]) {
  return [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Bạn cần đăng nhập admin để dùng hộp thư hỗ trợ.");
      setLoading(false);
      return;
    }

    let ignore = false;

    const bootstrap = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/api/chat/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (ignore) {
          return;
        }

        const nextConversations = sortConversations(
          (((response.data?.data as (ChatConversation & { _id?: string })[]) ?? []).map(
            normalizeConversation,
          ) as ChatConversation[]),
        );
        setConversations(nextConversations);
        setActiveConversationId((current) => current ?? nextConversations[0]?.id ?? null);
      } catch (requestError) {
        console.error(requestError);
        if (!ignore) {
          setError("Không thể tải danh sách hội thoại hỗ trợ.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return undefined;
    }

    const socket = io(apiUrl, {
      auth: { token: `Bearer ${token}` },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("CHAT_JOIN_ADMIN");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("CHAT_CONVERSATION_UPDATED", (payload: ChatConversation) => {
      const normalizedPayload = normalizeConversation(payload);

      setConversations((current) => {
        const existingIndex = current.findIndex(
          (item) => item.id === normalizedPayload.id,
        );
        if (existingIndex === -1) {
          return sortConversations([normalizedPayload, ...current]);
        }

        const next = [...current];
        next[existingIndex] = {
          ...next[existingIndex],
          ...normalizedPayload,
          messages: normalizedPayload.messages ?? next[existingIndex].messages,
        };
        return sortConversations(next);
      });
      setActiveConversationId((current) => current ?? normalizedPayload.id);
    });

    socket.on(
      "CHAT_PRESENCE_UPDATED",
      ({ conversationId, ...presence }: ChatPresencePayload) => {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, ...presence }
              : conversation,
          ),
        );
      },
    );

    socket.on(
      "CHAT_TYPING_UPDATED",
      ({ conversationId, ...presence }: ChatPresencePayload) => {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, ...presence }
              : conversation,
          ),
        );
      },
    );

    socket.on(
      "CHAT_MESSAGE_RECEIVED",
      ({ conversationId, message }: { conversationId: string; message: ChatMessage }) => {
        setConversations((current) =>
          current.map((conversation) => {
            if (conversation.id !== conversationId) {
              return conversation;
            }

            const exists = conversation.messages.some((item) => item.id === message.id);
            if (exists) {
              return conversation;
            }

            return {
              ...conversation,
              messages: [...conversation.messages, message],
            };
          }),
        );
      },
    );

    socket.on("CHAT_ERROR", ({ message }: { message: string }) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!activeConversationId || !socketRef.current || !connected) {
      return;
    }

    socketRef.current.emit("CHAT_JOIN_CONVERSATION", {
      conversationId: activeConversationId,
    });

    void axios.patch(
      `${apiUrl}/api/chat/conversations/${activeConversationId}/seen`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      },
    );
  }, [activeConversationId, connected]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!activeConversationId || !token) {
      return;
    }

    let ignore = false;

    const fetchConversationDetail = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/chat/conversations/${activeConversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!ignore) {
          const detail = normalizeConversation(response.data?.data as ChatConversation);
          setConversations((current) =>
            sortConversations(
              current.map((conversation) =>
                conversation.id === detail.id ? { ...conversation, ...detail } : conversation,
              ),
            ),
          );
        }
      } catch (requestError) {
        console.error(requestError);
      }
    };

    void fetchConversationDetail();

    return () => {
      ignore = true;
    };
  }, [activeConversationId]);

  const emitTyping = (isTyping: boolean) => {
    if (!activeConversationId || !socketRef.current) {
      return;
    }

    socketRef.current.emit("CHAT_TYPING", {
      conversationId: activeConversationId,
      isTyping,
    });
  };

  const handleMessageChange = (value: string) => {
    setMessageInput(value);
    emitTyping(true);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      emitTyping(false);
    }, 1200);
  };

  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text || !activeConversationId || !socketRef.current) {
      return;
    }

    setError("");
    socketRef.current.emit("CHAT_SEND_MESSAGE", {
      conversationId: activeConversationId,
      text,
    });
    setMessageInput("");
    emitTyping(false);
  };

  return (
    <>
      <PageMeta
        title="Admin Support Chat"
        description="Realtime support chat between admin and Mini64 customers."
      />

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-indigo-950 to-sky-950 px-6 py-7 text-white shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                Admin Support
              </p>
              <h1 className="mt-3 text-3xl font-bold">Realtime Customer Inbox</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Trả lời theo từng khách, xem trạng thái online/offline và theo dõi typing realtime.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Conversations
                </p>
                <p className="mt-2 text-2xl font-bold">{conversations.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Online users
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {conversations.filter((item) => item.isCustomerOnline).length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Socket
                </p>
                <p className="mt-2 text-lg font-bold">
                  {connected ? "Connected" : "Reconnecting"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={setActiveConversationId}
          />

          <div className="flex min-h-[72vh] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                Đang tải hộp thư hỗ trợ...
              </div>
            ) : activeConversation ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {activeConversation.customerName}
                        </p>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            activeConversation.isCustomerOnline
                              ? "bg-emerald-400"
                              : "bg-slate-300"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {activeConversation.customerEmail || "Guest customer"}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <BellRing className="h-4 w-4 text-indigo-500" />
                    {activeConversation.isCustomerOnline ? "Online" : "Offline"}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-5 py-5">
                  <div className="space-y-4">
                    {activeConversation.messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.senderRole === "admin"}
                      />
                    ))}

                    {activeConversation.typingRole === "customer" ? (
                      <TypingIndicator label={`${activeConversation.customerName} đang nhập`} />
                    ) : null}
                    <div ref={endRef} />
                  </div>
                </div>

                <ChatComposer
                  value={messageInput}
                  onChange={handleMessageChange}
                  onSubmit={handleSendMessage}
                  placeholder="Trả lời khách hàng..."
                />
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-slate-500">
                <MessagesSquare className="h-10 w-10 text-slate-300" />
                <p className="mt-4 text-lg font-semibold text-slate-700">
                  Chọn một cuộc trò chuyện
                </p>
                <p className="mt-2 max-w-md text-sm leading-7">
                  Danh sách bên trái sẽ cập nhật realtime khi khách bắt đầu nhắn tin.
                </p>
              </div>
            )}

            {error ? (
              <div className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-500">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
