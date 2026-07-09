"use client";

import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false },
);

type UiwMarkdownEditorProps = {
  value: string;
  height?: string;
  onChange: (value: string) => void;
};

export default function UiwMarkdownEditor({
  value,
  height = "100%",
  onChange,
}: UiwMarkdownEditorProps) {
  return (
    <MarkdownEditor
      value={value}
      height={height}
      enableScroll
      onChange={(...args: unknown[]) => {
        const nextValue =
          typeof args[0] === "string"
            ? args[0]
            : typeof args[2] === "string"
              ? args[2]
              : "";
        onChange(nextValue);
      }}
    />
  );
}
