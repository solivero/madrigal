import { useState } from "react";
import type { BoardProps } from "boardgame.io/dist/types/packages/react";
import { MessageCircle, Send } from "lucide-react";

type ChatProps = Pick<BoardProps, "sendChatMessage" | "chatMessages">;

export function Chat({ sendChatMessage, chatMessages }: ChatProps) {
  const [draft, setDraft] = useState("");

  return (
    <div className="parchment-panel flex h-full flex-col rounded-lg p-3">
      <h3 className="font-display mb-2 flex items-center gap-2 text-sm uppercase tracking-widest text-ink-soft">
        <MessageCircle className="size-4" /> Words
      </h3>
      <div className="font-serif flex-1 space-y-1 overflow-y-auto text-xs leading-snug text-ink">
        {chatMessages.map((m) => (
          <div key={m.id}>
            <span className="font-display text-burgundy">{m.sender}:</span>{" "}
            {(m.payload as { text: string }).text}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          sendChatMessage({ text: draft, time: Date.now() });
          setDraft("");
        }}
        className="mt-2 flex gap-1"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Speak…"
          className="font-serif flex-1 min-w-0 rounded border border-gold-dark/50 bg-parchment/70 px-2 py-1 text-xs text-ink focus:border-burgundy focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send"
          className="rounded border border-gold-dark bg-burgundy px-2 text-parchment hover:bg-burgundy-dark"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}
