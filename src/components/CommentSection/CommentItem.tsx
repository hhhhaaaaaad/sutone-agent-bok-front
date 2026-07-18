'use client';

import { useState } from 'react';
import type { CommentItemResponse } from '@/types/comment';
import CommentInput from './CommentInput';
import FollowButton from '@/components/FollowButton';

interface Props {
  comment: CommentItemResponse;
  currentUserId?: number;
  submitting: boolean;
  onReply: (content: string, parentId?: number) => void;
  onLike: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  depth?: number;
}

export default function CommentItem({ comment, currentUserId, submitting, onReply, onLike, onDelete, depth = 0 }: Props) {
  const [showReply, setShowReply] = useState(false);
  const canDelete = currentUserId !== undefined && (comment.authorId === currentUserId);

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-[#e6e2db] pl-4' : ''}`}>
      <div className="py-3">
        <div className="flex items-start gap-3">
          {comment.avatarUrl ? (
            <img src={comment.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#e6e2db] flex items-center justify-center text-xs text-slate-500 shrink-0">
              {(comment.authorName || '?')[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-[#22252a]">{comment.authorName || '匿名'}</span>
              {currentUserId && comment.authorId !== currentUserId && (
                <FollowButton targetUserId={comment.authorId} />
              )}
              <span>{comment.createTime}</span>
            </div>
            <p className="mt-1 text-sm text-[#3f444b] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
              <button
                onClick={() => onLike(comment.commentId)}
                className={`${comment.liked ? 'text-blue-500' : 'hover:text-slate-600'}`}
              >
                {comment.liked ? '已赞' : '赞'} {comment.likeCount > 0 ? comment.likeCount : ''}
              </button>
              {depth === 0 && (
                <button onClick={() => setShowReply(!showReply)} className="hover:text-slate-600">
                  回复
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(comment.commentId)} className="text-red-400 hover:text-red-500">
                  删除
                </button>
              )}
            </div>
          </div>
        </div>
        {showReply && (
          <div className="mt-3 ml-11">
            <CommentInput
              submitting={submitting}
              onSubmit={onReply}
              replyTo={{ commentId: comment.commentId, authorName: comment.authorName }}
              onCancelReply={() => setShowReply(false)}
            />
          </div>
        )}
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.commentId}
              comment={reply}
              currentUserId={currentUserId}
              submitting={submitting}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
