"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { writingChatApi } from "@/api/writing-chat";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { ChatMessage } from "@/types/writing-chat";

interface WritingChatPanelProps {
  userId: number;
  draftId: number;
  draftTitle: string;
  draftContent: string;
  onApplyResult: (action: "append" | "replace", content: string) => void;
}

export default function WritingChatPanel({
  userId, draftId, draftTitle, draftContent, onApplyResult
}: WritingChatPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [saved, setSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const firstMessageSent = useRef(false);

  // 创建会话
  useEffect(() => {
    (async () => {
      try {
        const sid = await writingChatApi.createSession(draftId);
        setSessionId(sid);
        setSessionError("");
      } catch (e: unknown) {
        setSessionError(e instanceof Error ? e.message : "创建会话失败");
      }
    })();
    return () => { controllerRef.current?.abort(); };
  }, [userId, draftId]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamBuffer]);

  // 构建第一条消息（自动带草稿上下文）
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !sessionId || streaming) return;

    // 首条消息自动附带草稿上下文
    let fullMessage: string;
    if (firstMessageSent.current) {
      fullMessage = text;
    } else {
      firstMessageSent.current = true;
      const contextSnippet = draftContent.length > 500
        ? draftContent.slice(0, 500) + "..."
        : draftContent;
      fullMessage = `【当前草稿上下文】\n标题：${draftTitle || "无标题"}\n正文：${contextSnippet || "空"}\n\n【用户指令】\n${text}`;
    }

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setStreaming(true);
    setStreamBuffer("");
    setSaved(false);

    // 取消上一个未完成的流
    controllerRef.current?.abort();
    const currentId = ++requestId.current;

    try {
      const controller = await writingChatApi.streamChat(
        sessionId, fullMessage,
        (token) => {
          if (requestId.current !== currentId) return;
          setStreamBuffer(prev => prev + token);
        },
        () => {
          if (requestId.current !== currentId) return;
          setStreamBuffer(prev => {
            if (prev) setMessages(msgs => [...msgs, { role: "assistant", content: prev }]);
            return "";
          });
          setStreaming(false);
        },
        async (err) => {
          if (requestId.current !== currentId) return;
          // Session 过期自动重连
          if (err.message.includes('Session not found') || err.message.includes('500')) {
            try {
              const newSid = await writingChatApi.createSession(draftId);
              setSessionId(newSid);
              setMessages(prev => [...prev, { role: "assistant", content: "[会话已过期，已自动重连，请重新发送消息]" }]);
            } catch {
              setSessionError("重连失败，请刷新页面");
            }
          } else {
            setStreamBuffer("");
            setMessages(prev => [...prev, { role: "assistant", content: `[错误] ${err.message}` }]);
          }
          setStreaming(false);
        },
      );
      controllerRef.current = controller;
    } catch { setStreaming(false); }
  }, [input, sessionId, streaming, draftTitle, draftContent, draftId]);

  const handleStop = () => {
    controllerRef.current?.abort();
    if (streamBuffer) {
      setMessages(prev => [...prev, { role: "assistant", content: streamBuffer }]);
      setStreamBuffer("");
    }
    setStreaming(false);
  };

  const handleSave = async () => {
    if (!sessionId || messages.length === 0) return;
    const lastUser = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")?.content ?? "";
    try {
      await writingChatApi.save(sessionId, lastUser, lastAssistant);
      setSaved(true);
    } catch (e) {
      console.error("保存记忆失败", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (sessionError) {
    return <p className="text-xs text-red-500 text-center mt-4">{sessionError}</p>;
  }
  if (!sessionId) {
    return <p className="text-xs text-[#b9b2a8] text-center mt-4">正在创建会话...</p>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 对话历史 */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2">
        {messages.length === 0 && !streaming && (
          <p className="text-xs text-[#b9b2a8] text-center mt-8">
            开始和 AI 对话，逐步完善你的文章
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-[12px] px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-[#eef5f0] text-[#22252a]"
                : "bg-white border border-[#e6e2db] text-[#5d636c]"
            }`}>
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
              ) : (
                <>
                  <MarkdownRenderer content={msg.content} className="text-xs leading-6 markdown-body" />
                  {/* 采纳按钮 */}
                  <div className="mt-2 flex gap-2 border-t border-[#e6e2db] pt-2">
                    <button onClick={() => onApplyResult("append", msg.content)}
                      className="text-[10px] text-[#567260] hover:underline">追加正文</button>
                    <button onClick={() => onApplyResult("replace", msg.content)}
                      className="text-[10px] text-[#5d636c] hover:underline">替换正文</button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {streamBuffer && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-[12px] border border-[#b4bdc7] bg-white px-3 py-2">
              <MarkdownRenderer content={streamBuffer} stream className="text-xs leading-6 markdown-body" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-[#e6e2db] p-3 space-y-2 shrink-0">
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          rows={2} disabled={streaming}
          className="w-full rounded-[10px] border border-[#e6e2db] bg-white p-2 text-sm text-[#5d636c] outline-none placeholder:text-[#b9b2a8] resize-none disabled:opacity-50"
          aria-label="输入消息"
        />
        <div className="flex gap-2">
          {streaming ? (
            <button onClick={handleStop}
              className="flex-1 rounded-[10px] border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-500 hover:bg-red-100 transition">
              停止生成
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim()}
              className="flex-1 rounded-[10px] bg-[#567260] px-3 py-2 text-xs text-white hover:bg-[#4a6354] disabled:opacity-40 transition">
              发送
            </button>
          )}
          <button onClick={handleSave} disabled={messages.length === 0 || streaming}
            className={`rounded-[10px] border px-3 py-2 text-xs transition ${
              saved ? "border-[#7fa08a] text-[#567260] bg-[#eef5f0]" : "border-[#e6e2db] text-[#858c96] hover:bg-[#f7f5f2]"
            } disabled:opacity-40`}>
            {saved ? "已记忆 ✓" : "保存记忆"}
          </button>
          <button onClick={() => { setMessages([]); firstMessageSent.current = false; setSaved(false); }}
            className="rounded-[10px] border border-[#e6e2db] px-3 py-2 text-xs text-[#858c96] hover:bg-[#f7f5f2] transition">
            清空
          </button>
        </div>
      </div>
    </div>
  );
}
