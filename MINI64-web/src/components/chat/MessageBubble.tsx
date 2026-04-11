import type { ChatMessage } from "../../types/chat";

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({
  message,
  isOwnMessage,
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
}) {
  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-[24px] px-4 py-3 shadow-sm ${
          isOwnMessage
            ? "rounded-br-md bg-indigo-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
        }`}
      >
        {!isOwnMessage ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {message.senderName}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
        <p
          className={`mt-2 text-[11px] ${
            isOwnMessage ? "text-indigo-100" : "text-slate-400"
          }`}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
