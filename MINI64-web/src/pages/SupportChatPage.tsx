import { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Headphones, ShieldCheck } from "lucide-react";
import ChatComposer from "../components/chat/ChatComposer";
import MessageBubble from "../components/chat/MessageBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import { UserContext } from "../context/UserContext";
import type { ChatConversation, ChatMessage, ChatPresencePayload } from "../types/chat";

const apiUrl = import.meta.env.VITE_API_URL;
const guestNameKey = "mini64_support_guest_name";
const guestSessionKey = "mini64_support_guest_session";

function ensureGuestSessionId() {
  const existing = localStorage.getItem(guestSessionKey);
  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  localStorage.setItem(guestSessionKey, nextId);
  return nextId;
}

export default function SupportChatPage() {
  const { user } = useContext(UserContext);
  const [guestName, setGuestName] = useState(
    user?.name || localStorage.getItem(guestNameKey) || "",
  );
  const [draftName, setDraftName] = useState(user?.name || guestName || "");
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [booting, setBooting] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<ChatPresencePayload | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const shouldPromptName = !user && !guestName;

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (shouldPromptName) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const bootstrapConversation = async () => {
      try {
        setBooting(true);
        setError("");

        const response = await axios.post(
          `${apiUrl}/api/chat/session`,
          {
            guestName: user?.name || guestName,
            guestSessionId: ensureGuestSessionId(),
          },
          {
            headers: authHeaders,
          },
        );

        const nextConversation = response.data?.data as ChatConversation;
        if (!ignore) {
          setConversation(nextConversation);
          setMessages(nextConversation.messages ?? []);
          setPresence({
            conversationId: nextConversation.id,
            isAdminOnline: !!nextConversation.isAdminOnline,
            isCustomerOnline: true,
            typingRole: nextConversation.typingRole ?? null,
          });
        }
      } catch (requestError) {
        console.error(requestError);
        if (!ignore) {
          setError("Không thể khởi tạo cuộc trò chuyện hỗ trợ.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setBooting(false);
        }
      }
    };

    void bootstrapConversation();

    return () => {
      ignore = true;
    };
  }, [authHeaders, guestName, shouldPromptName, user]);

  useEffect(() => {
    if (!conversation?.id) {
      return undefined;
    }

    const token = localStorage.getItem("access_token");
    const socket = io(apiUrl, {
      auth: token ? { token: `Bearer ${token}` } : undefined,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("CHAT_JOIN_CONVERSATION", {
        conversationId: conversation.id,
        guestSessionId: ensureGuestSessionId(),
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("CHAT_MESSAGE_RECEIVED", ({ conversationId, message }) => {
      if (conversationId !== conversation.id || !message) {
        return;
      }

      setMessages((current) => {
        const exists = current.some((item) => item.id === message.id);
        return exists ? current : [...current, message];
      });
    });

    socket.on("CHAT_CONVERSATION_UPDATED", (payload: ChatConversation) => {
      if (payload.id !== conversation.id) {
        return;
      }

      setConversation(payload);
      setMessages(payload.messages ?? []);
      setPresence({
        conversationId: payload.id,
        isAdminOnline: !!payload.isAdminOnline,
        isCustomerOnline: true,
        typingRole: payload.typingRole ?? null,
      });
    });

    socket.on("CHAT_PRESENCE_UPDATED", (payload: ChatPresencePayload) => {
      if (payload.conversationId !== conversation.id) {
        return;
      }

      setPresence(payload);
    });

    socket.on("CHAT_TYPING_UPDATED", (payload: ChatPresencePayload) => {
      if (payload.conversationId !== conversation.id) {
        return;
      }

      setPresence(payload);
    });

    socket.on("CHAT_ERROR", ({ message }: { message: string }) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation?.id || !messages.length) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.senderRole !== "admin") {
      return;
    }

    void axios.patch(
      `${apiUrl}/api/chat/conversations/${conversation.id}/seen`,
      {
        guestSessionId: ensureGuestSessionId(),
      },
      {
        headers: authHeaders,
      },
    );
  }, [authHeaders, conversation?.id, messages]);

  const emitTyping = (isTyping: boolean) => {
    if (!conversation?.id || !socketRef.current) {
      return;
    }

    socketRef.current.emit("CHAT_TYPING", {
      conversationId: conversation.id,
      guestSessionId: ensureGuestSessionId(),
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
    if (!text || !conversation?.id || !socketRef.current) {
      return;
    }

    setError("");
    socketRef.current.emit("CHAT_SEND_MESSAGE", {
      conversationId: conversation.id,
      guestSessionId: ensureGuestSessionId(),
      text,
    });
    setMessageInput("");
    emitTyping(false);
  };

  const handleStartChat = () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên trước khi bắt đầu chat.");
      return;
    }

    localStorage.setItem(guestNameKey, trimmedName);
    setGuestName(trimmedName);
    setError("");
    setLoading(true);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_38%,#ffffff_100%)] pt-28 text-slate-900">
      <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Support Chat
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Nhắn trực tiếp với admin
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Chat realtime 1-1, lưu lịch sử, có trạng thái online và thông báo đang nhập.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                presence?.isAdminOnline ? "bg-emerald-400" : "bg-slate-300"
              }`}
            />
            <span className="text-sm font-medium text-slate-600">
              {presence?.isAdminOnline ? "Admin đang online" : "Admin đang offline"}
            </span>
          </div>
        </div>

        {shouldPromptName ? (
          <div className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600">
              <Headphones className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">
              Bắt đầu cuộc trò chuyện
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Nhập tên để admin biết đang hỗ trợ ai. Sau đó cuộc trò chuyện sẽ được lưu lại.
            </p>

            <div className="mt-6 space-y-4">
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Tên của bạn"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleStartChat}
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-500"
              >
                Bắt đầu chat
              </button>
              {error ? <p className="text-sm text-rose-500">{error}</p> : null}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-sm font-bold text-white">
                  A
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Mini64 Admin</p>
                  <p className="text-xs text-slate-500">
                    {connected ? "Kết nối realtime đang hoạt động" : "Đang kết nối lại..."}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                lịch sử đã lưu
              </div>
            </div>

            <div className="min-h-[60vh] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-5 sm:px-6">
              {loading || booting ? (
                <div className="flex min-h-[48vh] items-center justify-center text-sm text-slate-500">
                  Đang tải cuộc trò chuyện...
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.senderRole === "customer"}
                      />
                    ))
                  ) : (
                    <div className="flex min-h-[44vh] items-center justify-center px-6 text-center text-sm text-slate-500">
                      Chưa có tin nhắn nào. Hãy gửi lời chào để admin hỗ trợ bạn nhanh hơn.
                    </div>
                  )}

                  {presence?.typingRole === "admin" ? (
                    <TypingIndicator label="Admin đang nhập" />
                  ) : null}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <ChatComposer
              value={messageInput}
              disabled={!conversation?.id || loading}
              onChange={handleMessageChange}
              onSubmit={handleSendMessage}
              placeholder="Nhập nội dung cần hỗ trợ..."
            />

            {error ? (
              <div className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-500">
                {error}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
