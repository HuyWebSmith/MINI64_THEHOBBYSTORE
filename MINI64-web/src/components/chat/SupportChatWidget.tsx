import { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Headphones,
  MessageCircleMore,
  Minimize2,
  ShieldCheck,
  X,
} from "lucide-react";
import ChatComposer from "./ChatComposer";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { UserContext } from "../../context/UserContext";
import type {
  ChatConversation,
  ChatMessage,
  ChatPresencePayload,
} from "../../types/chat";

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

export default function SupportChatWidget() {
  const { user } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState(
    user?.name || localStorage.getItem(guestNameKey) || "",
  );
  const [draftName, setDraftName] = useState(user?.name || guestName || "");
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
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
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen || shouldPromptName) {
      return;
    }

    let ignore = false;

    const bootstrapConversation = async () => {
      try {
        setLoading(true);
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

        if (ignore) {
          return;
        }

        const nextConversation = response.data?.data as ChatConversation;
        setConversation(nextConversation);
        setMessages(nextConversation.messages ?? []);
        setPresence({
          conversationId: nextConversation.id,
          isAdminOnline: !!nextConversation.isAdminOnline,
          isCustomerOnline: true,
          typingRole: nextConversation.typingRole ?? null,
        });
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

    if (!conversation?.id) {
      void bootstrapConversation();
    }

    return () => {
      ignore = true;
    };
  }, [
    authHeaders,
    conversation?.id,
    guestName,
    isOpen,
    shouldPromptName,
    user,
  ]);

  useEffect(() => {
    if (!isOpen || !conversation?.id) {
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
  }, [conversation?.id, isOpen]);

  useEffect(() => {
    if (!isOpen || !conversation?.id || !messages.length) {
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
  }, [authHeaders, conversation?.id, isOpen, messages]);

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
  };

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-32px)] max-w-[380px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Mini64 Support</p>
                <p className="text-xs text-indigo-100">
                  {presence?.isAdminOnline
                    ? "Admin đang online"
                    : "Admin đang offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {shouldPromptName ? (
            <div className="space-y-4 px-5 py-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                lịch sử chat sẽ được lưu
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Bắt đầu chat
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Nhập tên để admin biết đang hỗ trợ ai.
                </p>
              </div>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Tên của bạn"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleStartChat}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 font-semibold text-white transition hover:bg-indigo-500"
              >
                Bắt đầu chat
              </button>
              {error ? <p className="text-sm text-rose-500">{error}</p> : null}
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                {connected
                  ? "Kết nối realtime đang hoạt động"
                  : "Đang kết nối lại..."}
              </div>

              <div className="h-[420px] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.10),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-4">
                {loading || booting ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Đang tải cuộc trò chuyện...
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.senderRole === "customer"}
                      />
                    ))}
                    {presence?.typingRole === "admin" ? (
                      <TypingIndicator label="Admin đang nhập" />
                    ) : null}
                    <div ref={endRef} />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center px-5 text-center text-sm text-slate-500">
                    Chưa có tin nhắn nào. Gửi lời chào để bắt đầu cuộc trò
                    chuyện.
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
                <div className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-500">
                  {error}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(59,130,246,0.35)] transition hover:scale-105 hover:shadow-[0_24px_70px_rgba(59,130,246,0.45)]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/18">
          <MessageCircleMore className="h-5 w-5" />
        </span>
      </button>
    </>
  );
}
