import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  updatedAt: string;
  messages: UIMessage[];
};

const STORAGE_KEY = "aetheros.chat.threads.v1";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function textFromMessage(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
}

function titleFromMessages(messages: UIMessage[]) {
  const firstUser = messages.find((message) => message.role === "user");
  const text = firstUser ? textFromMessage(firstUser) : "";
  return text ? text.slice(0, 48) + (text.length > 48 ? "…" : "") : "New architecture chat";
}

export function createChatThread(id = createId()): ChatThread {
  return { id, title: "New architecture chat", updatedAt: new Date().toISOString(), messages: [] };
}

export function readChatThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as ChatThread[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((thread) => thread && typeof thread.id === "string");
  } catch {
    return [];
  }
}

export function writeChatThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function ensureChatThread(threadId?: string) {
  const threads = readChatThreads();
  const existing = threadId ? threads.find((thread) => thread.id === threadId) : threads[0];
  if (existing) return { thread: existing, threads };

  const thread = createChatThread(threadId);
  const next = [thread, ...threads];
  writeChatThreads(next);
  return { thread, threads: next };
}

export function updateThreadMessages(threads: ChatThread[], threadId: string, messages: UIMessage[]) {
  const now = new Date().toISOString();
  const next = threads.map((thread) =>
    thread.id === threadId
      ? { ...thread, messages, title: titleFromMessages(messages), updatedAt: now }
      : thread,
  );
  writeChatThreads(next);
  return next;
}

export function removeChatThread(threads: ChatThread[], threadId: string) {
  const next = threads.filter((thread) => thread.id !== threadId);
  const fallback = next.length ? next : [createChatThread()];
  writeChatThreads(fallback);
  return fallback;
}