'use client';

import { useState, useEffect } from 'react';
import { followApi } from '@/api/follow';

interface Props {
  targetUserId: number;
}

export default function FollowButton({ targetUserId }: Props) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!targetUserId || fetched) return;
    setFetched(true);
    (async () => {
      try {
        const resp = await followApi.getStatus(targetUserId);
        setFollowing(resp.data?.following || false);
      } catch { /* ignore */ }
    })();
  }, [targetUserId, fetched]);

  const toggle = async () => {
    setLoading(true);
    const prev = following;
    setFollowing(!following);
    try {
      if (prev) {
        await followApi.unfollow(targetUserId);
      } else {
        await followApi.follow(targetUserId);
      }
    } catch {
      setFollowing(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50 ${
        following ? 'workspace-secondary-btn' : 'workspace-primary-btn'
      }`}
    >
      {loading ? '...' : following ? '已关注' : '关注'}
    </button>
  );
}
