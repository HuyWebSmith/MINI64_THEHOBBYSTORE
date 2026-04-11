import type { ChatConversation } from "../../types/chat";

function formatListTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
}: {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelect: (conversationId: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">
          Support Inbox
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Khách đang chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-indigo-200 bg-indigo-50 shadow-sm"
                      : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-sm font-bold text-white">
                        {conversation.customerName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-slate-900">
                            {conversation.customerName}
                          </p>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              conversation.isCustomerOnline
                                ? "bg-emerald-400"
                                : "bg-slate-300"
                            }`}
                          />
                        </div>
                        <p className="truncate text-sm text-slate-500">
                          {conversation.typingRole === "customer"
                            ? "Đang nhập..."
                            : conversation.lastMessageText || "Chưa có tin nhắn"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-slate-400">
                        {formatListTime(conversation.lastMessageAt)}
                      </p>
                      {conversation.unreadAdminCount > 0 ? (
                        <span className="mt-2 inline-flex min-w-6 items-center justify-center rounded-full bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white">
                          {conversation.unreadAdminCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
            Chưa có cuộc trò chuyện nào.
          </div>
        )}
      </div>
    </div>
  );
}
