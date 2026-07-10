"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { EditorStatus } from "@milkdown/core";
import { replaceAll } from "@milkdown/kit/utils";
import FormulaDialog from "@/components/MdxEditor/FormulaDialog";

import "@milkdown/crepe/theme/common/style.css";
import "./milkdown-theme.css";
import "katex/dist/katex.min.css";

export interface MilkdownEditorHandle {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
}

interface MilkdownEditorInnerProps {
  markdown: string;
  onChange: (markdown: string) => void;
  editorRef: React.RefObject<MilkdownEditorHandle | null>;
}

function EditorContent({
  markdown,
  onChange,
  editorRef,
  isDark,
  onToggleTheme,
}: MilkdownEditorInnerProps & {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const crepeRef = useRef<Crepe | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const [formulaOpen, setFormulaOpen] = useState(false);

  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: markdown,
      features: {
        [CrepeFeature.Latex]: true,
        [CrepeFeature.TopBar]: true,
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_, md) => {
        onChangeRef.current(md);
      });
    });

    crepeRef.current = crepe;
    return crepe;
  }, []);

  useEffect(() => {
    const crepe = crepeRef.current;
    if (!crepe || crepe.editor.status !== EditorStatus.Created) return;
    try {
      crepe.editor.action(replaceAll(markdown));
    } catch {
      // ignore transient editor state
    }
  }, [markdown]);

  useImperativeHandle(
    editorRef,
    () => ({
      getMarkdown: () => crepeRef.current?.getMarkdown() ?? markdown,
      setMarkdown: (md: string) => {
        try {
          crepeRef.current?.editor.action(replaceAll(md));
        } catch {
          // ignore
        }
      },
    }),
    [markdown]
  );

  const handleInsertFormula = (latex: string, displayMode: boolean) => {
    const md = displayMode ? `$$\n${latex}\n$$` : `$${latex}$`;
    try {
      crepeRef.current?.editor.action(replaceAll(md));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.dataset.crepeTheme = isDark ? "dark" : "light";
    return () => {
      delete document.documentElement.dataset.crepeTheme;
    };
  }, [isDark]);

  return (
    <>
      <Milkdown />
      <button
        title="插入公式"
        onClick={() => setFormulaOpen(true)}
        className="fixed right-4 top-[72px] z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6e2db] bg-white text-sm font-mono font-bold text-[#5d636c] shadow-sm hover:border-[#b4bdc7] transition"
      >
        ∑
      </button>
      <button
        title={isDark ? "切换亮色背景" : "切换暗色背景"}
        onClick={onToggleTheme}
        className="fixed right-4 top-[112px] z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6e2db] bg-white text-sm shadow-sm hover:border-[#b4bdc7] transition"
      >
        {isDark ? "☀" : "☾"}
      </button>
      {formulaOpen && (
        <FormulaDialog
          onInsert={handleInsertFormula}
          onClose={() => setFormulaOpen(false)}
        />
      )}
    </>
  );
}

const MilkdownEditorInner = forwardRef<MilkdownEditorHandle, Omit<MilkdownEditorInnerProps, "editorRef">>(
  function MilkdownEditorInner(props, ref) {
    const editorRef = useRef<MilkdownEditorHandle | null>(null);
    const [isDark, setIsDark] = useState(false);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => editorRef.current?.getMarkdown() ?? "",
      setMarkdown: (markdown: string) => editorRef.current?.setMarkdown(markdown),
    }));

    return (
      <MilkdownProvider>
        <EditorContent
          {...props}
          editorRef={editorRef}
          isDark={isDark}
          onToggleTheme={() => setIsDark((v) => !v)}
        />
      </MilkdownProvider>
    );
  }
);

export default MilkdownEditorInner;
