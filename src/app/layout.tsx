import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { themeInitializationScript } from "@/components/Theme/theme-script";

export const metadata: Metadata = {
  title: "AI Bok 创作社区Sutmuch",
  description: "Sutmuch 驱动的 AI Bok 创作社区与创作工作台",
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
        <Script src="/env-config.js" strategy="beforeInteractive" />
      </head>
      <body className="antialiased overflow-y-scroll">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
