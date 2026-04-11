import { SendHorizonal } from "lucide-react";

export default function ChatComposer({
  value,
  disabled,
  placeholder,
  onChange,
  onSubmit,
}: {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="border-t border-slate-200 bg-white/90 p-4 backdrop-blur-xl">
      <div className="flex items-end gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-inner">
        <textarea
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={placeholder ?? "Nhập tin nhắn của bạn..."}
          className="max-h-32 min-h-[44px] flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={onSubmit}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
