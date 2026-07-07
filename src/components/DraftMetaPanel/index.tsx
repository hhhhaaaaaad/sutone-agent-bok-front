"use client";

interface DraftMetaPanelProps {
  summary: string;
  coverUrl: string;
  onSummaryChange: (value: string) => void;
  onCoverUrlChange: (value: string) => void;
}

export default function DraftMetaPanel({ summary, coverUrl, onSummaryChange, onCoverUrlChange }: DraftMetaPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[#5d636c]">摘要说明</label>
        <textarea value={summary} onChange={(e) => onSummaryChange(e.target.value)} rows={4}
          placeholder="用 2 到 3 句话概括这篇文章的重点。"
          className="mt-2 w-full rounded-[12px] border border-[#e6e2db] bg-[#fcfbf8] p-3 text-sm text-[#22252a] outline-none focus:border-[#b4bdc7]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d636c]">封面图链接</label>
        <input value={coverUrl} onChange={(e) => onCoverUrlChange(e.target.value)}
          placeholder="https://example.com/cover.png" className="workspace-input mt-2 w-full text-sm" />
      </div>
    </div>
  );
}
