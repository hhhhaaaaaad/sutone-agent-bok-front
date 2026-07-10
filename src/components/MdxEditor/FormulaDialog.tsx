"use client";

import { useState, useEffect, useCallback } from "react";
import katex from "katex";

interface FormulaDialogProps {
  onInsert: (latex: string, displayMode: boolean) => void;
  onClose: () => void;
}

export default function FormulaDialog({ onInsert, onClose }: FormulaDialogProps) {
  const [latex, setLatex] = useState("");
  const [displayMode, setDisplayMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [error, setError] = useState("");

  const renderPreview = useCallback(() => {
    if (!latex.trim()) {
      setPreviewHtml("");
      setError("");
      return;
    }
    try {
      const html = katex.renderToString(latex, {
        displayMode,
        throwOnError: true,
        strict: false,
      });
      setPreviewHtml(html);
      setError("");
    } catch (e: unknown) {
      setPreviewHtml("");
      setError(e instanceof Error ? e.message : "公式语法错误");
    }
  }, [latex, displayMode]);

  useEffect(() => {
    const timer = setTimeout(renderPreview, 200);
    return () => clearTimeout(timer);
  }, [renderPreview]);

  const handleInsert = () => {
    if (!latex.trim()) return;
    onInsert(latex.trim(), displayMode);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-xl border border-[#e6e2db] bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#22252a]">插入 LaTeX 公式</span>
          <button
            onClick={onClose}
            className="text-[#858c96] hover:text-[#22252a] text-lg leading-none"
          >
            ×
          </button>
        </div>

        <textarea
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="输入 LaTeX，如 U_{Pat} = f(Emotion)"
          rows={3}
          className="w-full rounded-[10px] border border-[#e6e2db] bg-white p-2 text-sm text-[#3f444b] outline-none placeholder:text-[#b9b2a8] resize-none font-mono"
          autoFocus
        />

        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-1 text-xs text-[#858c96] cursor-pointer">
            <input
              type="checkbox"
              checked={displayMode}
              onChange={(e) => setDisplayMode(e.target.checked)}
              className="rounded"
            />
            块级公式（居中显示）
          </label>
        </div>

        <div className="mt-3 min-h-[48px] rounded-[10px] border border-[#e6e2db] bg-[#faf9f7] p-3 flex items-center justify-center">
          {error ? (
            <span className="text-xs text-red-400">{error}</span>
          ) : previewHtml ? (
            <span
              className="katex-preview text-[#3f444b]"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <span className="text-xs text-[#b9b2a8]">公式预览</span>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-[10px] border border-[#e6e2db] px-3 py-2 text-xs text-[#858c96] hover:bg-[#f5f3ef] transition"
          >
            取消
          </button>
          <button
            onClick={handleInsert}
            disabled={!latex.trim()}
            className="flex-1 rounded-[10px] bg-[#567260] px-3 py-2 text-xs text-white hover:bg-[#4a6354] disabled:opacity-40 transition"
          >
            插入公式
          </button>
        </div>
      </div>
    </div>
  );
}
