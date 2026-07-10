"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type { MilkdownEditorHandle } from "./MilkdownEditorInner";

const Editor = dynamic(() => import("./MilkdownEditorInner"), {
  ssr: false,
});

interface MilkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

const MilkdownEditor = forwardRef<MilkdownEditorHandle, MilkdownEditorProps>(
  function MilkdownEditor(props, ref) {
    return <Editor {...props} ref={ref} />;
  }
);

export default MilkdownEditor;
export type { MilkdownEditorHandle };
