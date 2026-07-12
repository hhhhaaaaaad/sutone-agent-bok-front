"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import DrawioViewer from "@/components/DrawioViewer";

type MarkdownRendererProps = {
  content: string;
  stream?: boolean;
  className?: string;
};

export default function MarkdownRenderer({
  content,
  stream = false,
  className,
}: MarkdownRendererProps) {
  const [displayedContent, setDisplayedContent] = useState("");

  useEffect(() => {
    if (!stream) return;

    const source = content || "";

    if (!source) {
      const resetTimer = window.setTimeout(() => setDisplayedContent(""), 0);
      return () => window.clearTimeout(resetTimer);
    }

    let index = 0;
    const step = Math.max(2, Math.ceil(source.length / 900));
    const timer = window.setInterval(() => {
      index = Math.min(source.length, index + step);
      setDisplayedContent(source.slice(0, index));

      if (index >= source.length) {
        window.clearInterval(timer);
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, [content, stream]);

  const renderContent = stream ? displayedContent : content || "";

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          code({ className, children, node, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            const content = String(children).replace(/\n$/, "");

            if (language === "drawio" && content.length > 0) {
              return <DrawioViewer xml={content} />;
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {renderContent}
      </ReactMarkdown>
    </div>
  );
}
