"use client";

import { useState } from "react";

interface PublishDialogProps {
  disabled: boolean;
  onClose: () => void;
  onPublish: (tags: string[]) => Promise<void>;
}

export default function PublishDialog({ disabled, onClose, onPublish }: PublishDialogProps) {
  const [tagsInput, setTagsInput] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
      await onPublish(tags);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4">发布文章</h3>
        <label className="text-sm text-slate-600">标签（逗号分隔）</label>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
          placeholder="例如: Java, Spring, 微服务"
          className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-300" />
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">取消</button>
          <button onClick={handlePublish} disabled={disabled || publishing}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {publishing ? "发布中..." : "确认发布"}
          </button>
        </div>
      </div>
    </div>
  );
}
