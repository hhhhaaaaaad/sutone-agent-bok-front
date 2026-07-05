'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setUserInfo, getUserInfo, clearUserInfo } from '@/utils/cookie';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    const userInfo = getUserInfo();
    if (userInfo && userInfo.user) {
      setIsLoggedIn(true);
      setCurrentUser(userInfo.user);
      // If already logged in, redirect to home
      router.push('/');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!username || !password) {
      setMsg({ text: '请输入账号与密码。', type: 'error' });
      return;
    }

    if (username !== 'admin' || password !== 'admin') {
      setMsg({ text: '账号或密码错误（演示账号：admin / admin）。', type: 'error' });
      return;
    }

    setUserInfo(username);
    setMsg({ text: '登录成功，正在跳转…', type: 'info' });
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin');
    setMsg({ text: '已填充演示账号。', type: 'info' });
  };

  const handleLogout = () => {
    clearUserInfo();
    setIsLoggedIn(false);
    setCurrentUser('');
    setMsg({ text: '已退出登录，cookie 已清除。', type: 'info' });
  };

  return (
    <div className="premium-shell premium-grid min-h-screen flex justify-center items-stretch p-7 theme-bg-yellow">
      <div className="w-full max-w-[1120px] grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-[18px]">
        {/* Hero Section */}
        <section className="theme-card rounded-[24px] overflow-hidden relative flex flex-col gap-[18px] p-[30px_30px_24px_30px]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] grid place-items-center bg-gradient-to-br from-[#67e8f9] via-[#7c3aed] to-[#22c55e] shadow-[0_8px_16px_rgba(124,58,237,0.2)] text-white font-extrabold text-sm tracking-[0.18em]">
              SM
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Sutmuch Creative Login</span>
              <strong className="text-base leading-[1.1] tracking-[0.2px] text-slate-800">
                AI Bok 创作社区Sutmuch
              </strong>
              <span className="text-xs text-slate-500">Sutmuch 驱动的创作工作流入口</span>
            </div>
          </div>

          <h1 className="mt-[6px] text-[30px] leading-[1.2] tracking-[0.2px] text-slate-800 font-bold">
            把图表、内容与表达整合进同一套 AI 创作社区
          </h1>
          <p className="m-0 text-slate-600 leading-[1.7] max-w-[52ch] text-sm">
            左侧展示社区的创作能力与视觉预览，右侧进行登录。当前为演示登录：
            账号 <b>admin</b>，密码 <b>admin</b>。登录成功后会在浏览器保存 cookie。
          </p>

          <div className="grid grid-cols-2 gap-3 mt-[6px]">
            {[
              { title: '工具调用', desc: '支持 API / Shell / 文件等执行链路编排' },
              { title: '记忆与上下文', desc: '可配置可审计，减少重复沟通成本' },
              { title: '多模型路由', desc: '按场景选择最合适的模型与策略' },
              { title: '可观测性', desc: '链路、成本、失败原因都能追踪' },
            ].map((item, idx) => (
              <div key={idx} className="border border-slate-200 bg-slate-50/50 rounded-[14px] p-3 flex gap-[10px] items-start">
                <div className="w-[10px] h-[10px] rounded-full mt-[5px] flex-shrink-0 bg-gradient-to-br from-[#22c55e] to-[#3b82f6] shadow-[0_0_0_4px_rgba(34,197,94,0.1)]"></div>
                <div>
                  <b className="block text-[13px] mb-[3px] text-slate-800">{item.title}</b>
                  <span className="block text-xs text-slate-500 leading-[1.5]">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-[10px] rounded-[20px] overflow-hidden glass-panel-dark h-[340px] relative p-5">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.1),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.1),transparent_28%)]" />
             <div className="relative h-full grid grid-cols-[1.1fr_0.9fr] gap-4">
               <div className="rounded-[18px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between backdrop-blur-md">
                 <div>
                   <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">Sutmuch</div>
                   <h3 className="mt-3 text-xl font-semibold text-white/90">AI Bok 创作社区Sutmuch</h3>
                   <p className="mt-3 text-sm leading-6 text-white/70">统一管理创作任务、视觉表达和内容资产，让 AI 不只停留在工具页，而是成为持续协作的创作搭档。</p>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                     <div className="text-[10px] text-white/50">Workspace</div>
                     <div className="mt-2 text-lg font-semibold text-white/90">Draw.io</div>
                   </div>
                   <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                     <div className="text-[10px] text-white/50">Studio</div>
                     <div className="mt-2 text-lg font-semibold text-white/90">PPT</div>
                   </div>
                 </div>
               </div>
               <div className="flex flex-col gap-3">
                 <div className="flex-1 rounded-[18px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-white/60">创作状态</span>
                     <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-300">Online</span>
                   </div>
                   <div className="mt-4 space-y-3">
                     <div className="rounded-xl bg-black/20 px-3 py-3 text-sm text-white/80">Sutmuch 正在生成图表结构与演示要点…</div>
                     <div className="rounded-xl bg-white/10 px-3 py-3 text-sm text-cyan-100">已整理出适合发布的内容框架与视觉素材。</div>
                   </div>
                 </div>
                 <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                   <div className="text-[11px] text-white/60">社区关键词</div>
                   <div className="mt-3 flex flex-wrap gap-2">
                     {['AI 写作', '图表创作', '演示生成', '社区沉淀'].map((tag) => (
                       <span key={tag} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/80">
                         {tag}
                       </span>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </section>

        {/* Login Form Section */}
        <section className="p-[28px] flex flex-col justify-center gap-[14px]">
          <div className="theme-card rounded-[16px] p-5">
            <h2 className="m-0 mb-[6px] text-[18px] text-slate-800 font-bold">登录 Sutmuch</h2>
            <p className="m-0 mb-4 text-slate-500 text-xs leading-[1.5]">
              演示账号：admin / admin（可在页面脚本中替换成真实鉴权接口）
            </p>

            {!isLoggedIn ? (
              <form onSubmit={handleLogin} autoComplete="on">
                <div className="flex flex-col gap-2 mb-3">
                  <label htmlFor="username" className="text-xs text-slate-600 tracking-[0.2px]">账号</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入账号"
                    autoComplete="username"
                    className="w-full rounded-[12px] theme-input p-3 outline-none transition-all duration-180 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2 mb-3">
                  <label htmlFor="password" className="text-xs text-slate-600 tracking-[0.2px]">密码</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    className="w-full rounded-[12px] theme-input p-3 outline-none transition-all duration-180 text-sm"
                  />
                </div>

                <div className="flex gap-[10px] items-center justify-between mt-[6px]">
                  <button type="submit" className="theme-btn rounded-[12px] p-[11px_14px] font-bold cursor-pointer border-0 transition-transform active:translate-y-[1px] active:brightness-[0.98] text-sm">
                    登录并保存 Cookie
                  </button>
                  <button type="button" onClick={handleFillDemo} className="theme-btn-secondary rounded-[12px] p-[11px_14px] font-semibold cursor-pointer transition-transform active:translate-y-[1px] active:brightness-[0.98] text-sm">
                    填充演示账号
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-[10px] items-center justify-between p-3 border border-dashed border-slate-200 rounded-[12px] bg-slate-50 mt-3">
                <div>
                  <strong className="block text-[13px] text-slate-800">已登录：{currentUser}</strong>
                  <span className="block text-xs text-slate-500 mt-[2px]">欢迎回来</span>
                </div>
                <button onClick={handleLogout} className="theme-btn-secondary rounded-[12px] p-[8px_12px] font-semibold cursor-pointer text-xs">
                  退出
                </button>
              </div>
            )}

            <div className={`min-h-[18px] text-xs mt-2 ${msg.type === 'error' ? 'text-red-500' : 'text-slate-500'}`}>
              {msg.text}
            </div>
          </div>

          <div className="mt-[14px] text-slate-400 text-xs text-center">
            © AI Bok 创作社区Sutmuch
          </div>
        </section>
      </div>
    </div>
  );
}
