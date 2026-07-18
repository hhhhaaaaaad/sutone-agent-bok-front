'use client';

import { useState } from 'react';

interface Props {
  submitting: boolean;
  onSubmit: (content: string, parentId?: number) => void;
  replyTo?: { commentId: number; authorName: string } | null;
  onCancelReply: () => void;
}

export default function CommentInput({ submitting, onSubmit, replyTo, onCancelReply }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim() || submitting) return;
    onSubmit(text.trim(), replyTo?.commentId);
    setText('');
  };

  return (
    <div className="space-y-2">
      {replyTo && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>回复 @{replyTo.authorName}</span>
          <button onClick={onCancelReply} className="text-blue-500 hover:underline">取消</button>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={replyTo ? `回复 @${replyTo.authorName}...` : '写下你的评论...'}
        className="w-full rounded-lg border border-[#e6e2db] bg-white p-3 text-sm text-[#3f444b] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none resize-none"
        rows={3}
        disabled={submitting}
      />
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="workspace-primary-btn px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          {submitting ? '发送中...' : '发表评论'}
        </button>
      </div>
    </div>
  );
}
