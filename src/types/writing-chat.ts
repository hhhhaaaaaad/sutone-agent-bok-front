export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface StreamChunkMsg {
  chunk: {
    type: "token" | "done" | "error";
    content?: string;
  };
}
