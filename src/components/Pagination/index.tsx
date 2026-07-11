"use client";

import { useState } from "react";

interface PaginationProps {
  pageNo: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onChange: (pageNo: number, pageSize: number) => void;
}

export default function Pagination({
  pageNo,
  pageSize,
  total,
  pageSizeOptions = [10, 20, 50],
  onChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [jumpInput, setJumpInput] = useState("");

  if (total === 0) return null;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  const visiblePages = pages.filter((p) => {
    if (totalPages <= 7) return true;
    if (p === 1 || p === totalPages) return true;
    if (Math.abs(p - pageNo) <= 1) return true;
    return false;
  });

  const handleJump = () => {
    const n = parseInt(jumpInput, 10);
    if (n >= 1 && n <= totalPages) {
      onChange(n, pageSize);
      setJumpInput("");
    }
  };

  const handlePageSizeChange = (size: number) => {
    onChange(1, size);
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(pageNo - 1, pageSize)}
          disabled={pageNo <= 1}
          className="rounded-[8px] border border-[#e6e2db] px-3 py-1.5 text-xs text-[#5d636c] hover:bg-[#f5f3ef] disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          上一页
        </button>

        {visiblePages.map((p, i) => {
          const prev = visiblePages[i - 1];
          return (
            <span key={p} className="flex items-center gap-1">
              {prev && p - prev > 1 && (
                <span className="text-xs text-[#b9b2a8]">…</span>
              )}
              <button
                onClick={() => onChange(p, pageSize)}
                className={`rounded-[8px] px-3 py-1.5 text-xs font-medium transition ${
                  p === pageNo
                    ? "bg-[#22252a] text-white"
                    : "border border-[#e6e2db] text-[#5d636c] hover:bg-[#f5f3ef]"
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          onClick={() => onChange(pageNo + 1, pageSize)}
          disabled={pageNo >= totalPages}
          className="rounded-[8px] border border-[#e6e2db] px-3 py-1.5 text-xs text-[#5d636c] hover:bg-[#f5f3ef] disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          下一页
        </button>
      </div>

      <span className="text-[11px] text-[#858c96]">
        共 {total} 条，{totalPages} 页
      </span>

      <select
        value={pageSize}
        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        className="rounded-[8px] border border-[#e6e2db] bg-white px-2 py-1.5 text-xs text-[#5d636c] outline-none hover:border-[#b4bdc7]"
      >
        {pageSizeOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt} 条/页
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <input
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handleJump()}
          placeholder={`1-${totalPages}`}
          className="w-14 rounded-[8px] border border-[#e6e2db] px-2 py-1.5 text-xs text-[#5d636c] outline-none placeholder:text-[#b9b2a8]"
        />
        <button
          onClick={handleJump}
          className="rounded-[8px] border border-[#e6e2db] px-2 py-1.5 text-xs text-[#5d636c] hover:bg-[#f5f3ef] transition"
        >
          跳转
        </button>
      </div>
    </div>
  );
}
