"use client";

import { useRef, useState } from "react";
import { filesApi } from "@/api/files";
import { API_CONFIG } from "@/config/api-config";

interface DraftMetaPanelProps {
  summary: string;
  coverUrl: string;
  onSummaryChange: (value: string) => void;
  onCoverUrlChange: (value: string) => void;
}

export default function DraftMetaPanel({ summary, coverUrl, onSummaryChange, onCoverUrlChange }: DraftMetaPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const resp = await filesApi.upload(file);
      onCoverUrlChange(resp.data.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const coverSrc = coverUrl
    ? coverUrl.startsWith("http") ? coverUrl : API_CONFIG.UPLOAD_BASE + coverUrl
    : "";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[#5d636c]">摘要说明</label>
        <textarea value={summary} onChange={(e) => onSummaryChange(e.target.value)} rows={4}
          placeholder="用 2 到 3 句话概括这篇文章的重点。"
          className="mt-2 w-full rounded-[12px] border border-[#e6e2db] bg-[#fcfbf8] p-3 text-sm text-[#22252a] outline-none focus:border-[#b4bdc7]" />
      </div>

      <div>
        <label className="text-xs font-medium text-[#5d636c]">封面图</label>

        {coverSrc && (
          <div className="mt-2 overflow-hidden rounded-[12px] border border-[#e6e2db]">
            <img src={coverSrc} alt="封面预览" className="w-full object-cover max-h-[160px]" />
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="workspace-secondary-btn px-3 py-2 text-xs font-medium disabled:opacity-50"
          >
            {uploading ? "上传中..." : coverUrl ? "更换封面" : "上传封面"}
          </button>
        </div>

        {uploadError && (
          <p className="mt-1 text-xs text-red-500">{uploadError}</p>
        )}

        <input
          value={coverUrl}
          onChange={(e) => onCoverUrlChange(e.target.value)}
          placeholder="或粘贴封面图链接"
          className="workspace-input mt-2 w-full text-sm"
        />
      </div>
    </div>
  );
}
