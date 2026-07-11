"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setUserInfo, getUserInfo } from "@/utils/cookie";
import { authApi } from "@/api/auth";
import WordGravity from "./WordGravity";
import ThemeToggle from "@/components/Theme/ThemeToggle";

const WRITER_QUOTES = [
  "写作，就是坐下来判断自己。 —— 易卜生",
  "生活从来不是公平的，得到多少，便要靠那个多少做到最好。 —— 萧伯纳",
  "灵感，是顽强劳动而获得的奖赏。 —— 列宾",
  "世界以痛吻我，要我报之以歌。 —— 泰戈尔",
  "真正的发现之旅，不在于寻找新的风景，而在于拥有新的眼光。 —— 普鲁斯特",
  "没有什么比时间更具有说服力了，因为时间无需通知我们就可以改变一切。 —— 余华",
];

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [typedQuote, setTypedQuote] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (userInfo && userInfo.user) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quote = WRITER_QUOTES[quoteIndex];
    const isComplete = typedQuote === quote;
    const isEmpty = typedQuote.length === 0;
    const delay = isComplete
      ? 2800
      : isEmpty && isDeleting
        ? 500
        : isDeleting
          ? 60
          : 130;

    const timer = window.setTimeout(() => {
      if (isComplete && !isDeleting) {
        setIsDeleting(true);
        return;
      }

      if (isEmpty && isDeleting) {
        setIsDeleting(false);
        setQuoteIndex((current) => {
          if (WRITER_QUOTES.length < 2) return current;
          let next = current;
          while (next === current) {
            next = Math.floor(Math.random() * WRITER_QUOTES.length);
          }
          return next;
        });
        return;
      }

      setTypedQuote(
        isDeleting
          ? quote.slice(0, typedQuote.length - 1)
          : quote.slice(0, typedQuote.length + 1),
      );
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isDeleting, quoteIndex, typedQuote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    setLoading(true);

    if (!username || !password) {
      setMsg({ text: "请输入账号与密码。", type: "error" });
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        await authApi.register({ username, password, nickname: username });
        setMsg({ text: "注册成功，请登录。", type: "info" });
        setIsRegistering(false);
      } else {
        const user = await authApi.login({ username, password });
        setUserInfo(username, user.userId);
        setMsg({ text: "登录成功，正在跳转…", type: "info" });
        setTimeout(() => router.push("/"), 500);
      }
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : "操作失败，请重试",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername("admin");
    setPassword("admin");
    setMsg({ text: "已填充演示账号。", type: "info" });
  };

  const highlights = [
    {
      title: "草稿记忆",
      desc: "自动记住最近上下文与编辑意图。",
    },
    {
      title: "资料同步",
      desc: "草稿、灵感与公开文章库保持同一套索引。",
    },
  ];

  return (
    <div className="min-h-screen theme-bg-yellow p-5 md:p-7">
      <div className="workspace-shell mx-auto grid min-h-[calc(100vh-40px)] max-w-[1180px] grid-cols-1 overflow-hidden lg:grid-cols-[0.95fr_1.35fr]">
        <section className="flex flex-col gap-6 bg-[#f1ece6] px-7 py-6 md:px-10 md:py-8">
          <div className="flex items-center justify-between text-[11px] tracking-[0.18em] text-[#858c96]">
            <div className="flex items-center gap-2">
              <span className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#d9b7a0]" />
                <span className="h-2 w-2 rounded-full bg-[#d7c6ae]" />
                <span className="h-2 w-2 rounded-full bg-[#c8d0c6]" />
              </span>
              <span className="workspace-mono">Sutmuch</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="workspace-mono">安静入口</span>
              <ThemeToggle compact />
            </div>
          </div>

          <div>
            <p className="workspace-mono text-[11px] uppercase tracking-[0.22em] text-[#5d636c]">
              Sutmuch 写作系统
            </p>
            <h1
              className="workspace-editorial mt-5 min-h-[4.8em] max-w-[18ch] text-[30px] leading-[1.2] text-[#22252a] md:text-[42px]"
              aria-label={WRITER_QUOTES[quoteIndex]}
            >
              <span aria-hidden="true">{typedQuote}</span>
              <span
                aria-hidden="true"
                className="ml-1 inline-block h-[0.9em] w-[2px] animate-pulse bg-[#7fa08a] align-[-0.05em]"
              />
            </h1>
            <p className="mt-5 max-w-[44ch] text-sm leading-7 text-[#5d636c]">
              从草稿、资料与文章库之间自然流转。让生成、改写与整理都像编辑纸稿一样克制而顺手。
            </p>
          </div>

          <WordGravity />

          <div className="workspace-panel rounded-[12px] p-5">
            <div className="flex items-center justify-between text-[11px] text-[#858c96]">
              <span className="font-medium text-[#22252a]">工作区预览</span>
              <span className="text-[#7fa08a]">已同步</span>
            </div>
            <div className="workspace-subpanel mt-3 rounded-[10px] p-4">
              <p className="text-[11px] text-[#858c96]">继续中的稿件</p>
              <h2 className="mt-3 max-w-[18ch] text-[18px] leading-7 text-[#22252a]">
                安静写作系统里的编辑型 AI 应该如何工作
              </h2>
              <p className="mt-4 text-xs text-[#858c96]">14 分钟前编辑</p>
              <div className="mt-4 space-y-2.5">
                <div className="h-2 rounded-full bg-[#ece5db]" />
                <div className="h-2 w-[72%] rounded-full bg-[#d5e2e8]" />
                <div className="h-2 w-[58%] rounded-full bg-[#e7ded4]" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="workspace-panel rounded-[10px] p-4"
              >
                <p className="workspace-mono text-[11px] tracking-[0.12em] text-[#858c96]">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#5d636c]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#fcfbf8] px-6 py-10 md:px-10">
          <div className="workspace-panel w-full max-w-[420px] rounded-[16px] p-6 md:p-8">
            <div>
              <p className="workspace-mono text-[11px] tracking-[0.16em] text-[#858c96]">
                {isRegistering ? "创建新账号" : "欢迎回来"}
              </p>
              <h2 className="mt-3 text-[36px] font-semibold tracking-tight text-[#22252a]">
                {isRegistering ? "注册创作工作台" : "登录创作工作台"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5d636c]">
                {isRegistering
                  ? "创建一个新账号开始写作、整理与发布流程。"
                  : "使用你的工作邮箱继续最近的写作、整理与发布流程。演示账号为 `admin / admin`。"}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              autoComplete="on"
              className="mt-8 space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-xs font-medium text-[#5d636c]"
                >
                  登录账号
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入账号"
                  autoComplete="username"
                  className="workspace-input w-full text-sm"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-[#5d636c]"
                >
                  登录密码
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    className="workspace-input w-full pr-16 text-sm"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#858c96]">
                    显示
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="workspace-primary-btn h-11 w-full text-sm font-medium"
                >
                  {loading
                    ? (isRegistering ? "注册中…" : "登录中…")
                    : (isRegistering ? "注册新账号" : "进入工作台")}
                </button>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="workspace-secondary-btn h-11 w-full text-sm font-medium"
                  >
                    填充演示账号
                  </button>
                )}
              </div>
            </form>

            <div
              className={`min-h-5 pt-3 text-xs ${msg.type === "error" ? "text-red-500" : "text-[#858c96]"}`}
            >
              {msg.text}
            </div>

            <div className="mt-3 text-center text-[11px] text-[#858c96]">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setMsg({ text: "", type: "" }); }}
                className="hover:text-[#22252a] transition"
              >
                {isRegistering ? "已有账号？去登录" : "没有账号？注册一个"}
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[#e6e2db] pt-5 text-[11px] text-[#858c96]">
              <span className="workspace-mono">可信设备 · Web 会话</span>
              <span>需要帮助？</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
