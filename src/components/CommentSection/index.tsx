'use client';

import { useState, useEffect, useCallback } from 'react';
import { commentApi } from '@/api/comment';
import type { CommentItemResponse, CommentPageResponse } from '@/types/comment';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

interface Props {
  articleId: number;
  currentUserId?: number;
}

export default function CommentSection({ articleId, currentUserId }: Props) {
  const [comments, setComments] = useState<CommentItemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const resp = await commentApi.list(articleId, p);
      const data = resp.data as unknown as CommentPageResponse;
      setComments(data.list || []);
      setTotal(data.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [articleId]);

  useEffect(() => { fetchComments(1); }, [fetchComments]);

  const handlePublish = async (content: string, parentId?: number) => {
    setSubmitting(true);
    try {
      await commentApi.publish(articleId, { content, parentId });
      fetchComments(page);
    } catch (e) {
      alert(e instanceof Error ? e.message : '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    try {
      const c = findComment(comments, commentId);
      if (c) {
        const resp = c.liked
          ? await commentApi.unlike(commentId)
          : await commentApi.like(commentId);
        fetchComments(page);
      }
    } catch { /* ignore */ }
  };

  const findComment = (list: CommentItemResponse[], id: number): CommentItemResponse | null => {
    for (const item of list) {
      if (item.commentId === id) return item;
      if (item.replies) {
        const found = findComment(item.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      await commentApi.delete(articleId, commentId);
      fetchComments(page);
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败');
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="border-t border-[#e6e2db] pt-8 mt-12">
      <h3 className="text-lg font-semibold text-[#22252a] mb-6">评论 ({total})</h3>

      <div className="mb-6">
        <CommentInput submitting={submitting} onSubmit={handlePublish} replyTo={null} onCancelReply={() => {}} />
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-4">加载中...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">暂无评论，快来发表第一条评论吧</p>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              currentUserId={currentUserId}
              submitting={submitting}
              onReply={handlePublish}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 text-sm text-slate-500">
          <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchComments(page - 1); }} className="hover:text-slate-700 disabled:opacity-30">上一页</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => { setPage(page + 1); fetchComments(page + 1); }} className="hover:text-slate-700 disabled:opacity-30">下一页</button>
        </div>
      )}
    </div>
  );
}
