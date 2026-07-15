'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { articlesApi } from '@/api/articles';
import { socialApi } from '@/api/social';
import { API_CONFIG } from '@/config/api-config';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CommentSection from '@/components/CommentSection';
import RecommendList from '@/components/RecommendList';
import FollowButton from '@/components/FollowButton';
import type { ArticleDetailResponse } from '@/types/article';
import WorkspaceHeader from '@/components/WorkspaceHeader';

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.articleId);
  const [article, setArticle] = useState<ArticleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [reverting, setReverting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();
  const fetchedRef = useRef(false);

  useEffect(() => {
    const info = getUserInfo();
    setCurrentUser(info?.user || '');
    setCurrentUserId(info?.userId);
  }, []);
  useEffect(() => {
    if (!articleId) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const resp = await articlesApi.detail(articleId);
        setArticle(resp.data);
        setLikeCount(resp.data.likeCount);
        setFavoriteCount(resp.data.favoriteCount);
        try {
          const likeStatus = await socialApi.getLikeStatus(articleId);
          setLiked(likeStatus.data.liked);
          setLikeCount(likeStatus.data.likeCount);
        } catch { /* use detail-provided count */ }
        try {
          const favStatus = await socialApi.getFavoriteStatus(articleId);
          setFavorited(favStatus.data.favorited);
          setFavoriteCount(favStatus.data.favoriteCount);
        } catch { /* use detail-provided count */ }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  const handleLogout = () => { clearUserInfo(); router.push('/login'); };

  const handleRevertToDraft = async () => {
    if (!articleId || reverting) return;
    setReverting(true);
    try {
      const resp = await articlesApi.revertToDraft(articleId);
      router.push(`/drafts/${resp.data.draftId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '回退失败');
      setReverting(false);
    }
  };

  const handleLikeToggle = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    const nextCount = liked ? likeCount - 1 : likeCount + 1;
    setLiked(!liked);
    setLikeCount(nextCount);
    try {
      const resp = liked
        ? await socialApi.unlike(articleId)
        : await socialApi.like(articleId);
      setLiked(resp.data.liked);
      setLikeCount(Math.max(resp.data.likeCount, nextCount));
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    const prevFav = favorited;
    const prevCount = favoriteCount;
    const nextCount = favorited ? favoriteCount - 1 : favoriteCount + 1;
    setFavorited(!favorited);
    setFavoriteCount(nextCount);
    try {
      const resp = favorited
        ? await socialApi.unfavorite(articleId)
        : await socialApi.favorite(articleId);
      setFavorited(resp.data.favorited);
      setFavoriteCount(Math.max(resp.data.favoriteCount, nextCount));
    } catch {
      setFavorited(prevFav);
      setFavoriteCount(prevCount);
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-gradient flex items-center justify-center">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen theme-bg-gradient flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || '文章不存在'}</p>
        <button onClick={() => router.push('/articles')} className="text-sm text-slate-500 underline">返回文章广场</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto max-w-[1280px] overflow-hidden bg-[#fcfbf8]">
        <WorkspaceHeader activePath="/articles" userName={currentUser} onLogout={handleLogout} />
        <header className="border-b border-[#e6e2db] flex items-center justify-between px-5 py-4 md:px-7">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/articles')} className="workspace-secondary-btn px-3 py-2 text-sm font-medium">
              返回文章广场
            </button>
            <button
              onClick={handleRevertToDraft}
              disabled={reverting}
              className="workspace-primary-btn px-3 py-2 text-sm font-medium disabled:opacity-40"
            >
              {reverting ? '回退中...' : '继续编辑'}
            </button>
          </div>
          <p className="workspace-mono hidden text-[11px] tracking-[0.14em] text-[#858c96] sm:block">工作区 / 文章详情</p>
        </header>

        <main className="px-5 py-8 md:px-10 md:py-10">
          {article.coverUrl && (
            <div className="mb-8 overflow-hidden rounded-[16px] border border-[#e6e2db]">
              <img
                src={article.coverUrl.startsWith('http') ? article.coverUrl : API_CONFIG.UPLOAD_BASE + article.coverUrl}
                alt={article.title}
                className="w-full object-cover max-h-[420px]"
              />
            </div>
          )}
          <h1 className="workspace-editorial text-[42px] leading-[1.05] text-[#22252a] md:text-[56px]">{article.title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#e6e2db] flex items-center justify-center text-[11px] font-medium text-slate-600 shrink-0">
                {(article.authorName || article.authorId || '?').toString()[0]}
              </div>
              <span className="text-[#22252a] font-medium">{article.authorName || `用户 #${article.authorId}`}</span>
              {article.authorId && article.authorId !== currentUserId && (
                <FollowButton key={article.authorId} targetUserId={article.authorId} />
              )}
            </div>
            <span className="text-[#858c96]">发布于 {article.publishTime}</span>
            <span className="text-[#858c96]">{article.viewCount} 阅读</span>
            {article.tags?.map(tag => (
              <span key={tag} className="workspace-status">{tag}</span>
            ))}
          </div>

          {article.summary && (
            <div className="workspace-subpanel mt-8 rounded-[12px] p-5 text-sm leading-7 text-[#5d636c] italic">
              {article.summary}
            </div>
          )}

          <article className="article-markdown prose prose-slate mt-10 max-w-none prose-headings:text-[#22252a] prose-p:text-[#3f444b] prose-li:text-[#4f555d]">
            <MarkdownRenderer
              key={article.articleId}
              content={article.contentMd || ''}
            />
          </article>

          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-[#e6e2db] pt-6">
            <button
              onClick={handleLikeToggle}
              disabled={likeLoading}
              className={`px-4 py-2 text-sm font-medium ${liked ? 'workspace-primary-btn' : 'workspace-secondary-btn'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {likeLoading ? '...' : liked ? `已点赞 ${likeCount}` : `点赞 ${likeCount}`}
            </button>
            <button
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className={`px-4 py-2 text-sm font-medium ${favorited ? 'workspace-primary-btn' : 'workspace-secondary-btn'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {favoriteLoading ? '...' : favorited ? `已收藏 ${favoriteCount}` : `收藏 ${favoriteCount}`}
            </button>
            {commentCount > 0 && (
              <span className="text-sm text-slate-400 ml-2">{commentCount} 条评论</span>
            )}
          </div>

          <CommentSection articleId={articleId} currentUserId={currentUserId} />
          <RecommendList />
        </main>
      </div>
    </div>
  );
}
