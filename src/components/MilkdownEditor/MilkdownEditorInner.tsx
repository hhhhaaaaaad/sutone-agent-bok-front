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
}: MilkdownEditorInnerProps) {
  const crepeRef = useRef<Crepe | null>(null);
  const onChangeRef = useRef(onChange);
  const syncingRef = useRef(false);
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
      featureConfigs: {
        [CrepeFeature.CodeMirror]: {
          renderPreview: (language: string, content: string, applyPreview: (v: null | string | HTMLElement) => void) => {
            if (language !== "drawio" || !content.trim()) {
              applyPreview(null);
              return;
            }

            const container = document.createElement("div");
            container.className = "drawio-preview";
            container.style.minHeight = "300px";
            container.style.overflow = "auto";

            const div = document.createElement("div");
            div.className = "mxgraph";
            div.setAttribute("data-mxgraph", JSON.stringify({
              highlight: "#0000ff",
              nav: true,
              resize: true,
              toolbar: "zoom layers lightbox",
              edit: "_blank",
              xml: content.trim(),
            }));
            container.appendChild(div);
            applyPreview(container);

            const SRC = "https://viewer.diagrams.net/js/viewer-static.min.js";
            const doRender = () => {
              const gv = window.GraphViewer;
              if (gv) {
                if (typeof gv.processElements === "function") {
                  gv.processElements(div);
                } else if (typeof gv.createViewerForElement === "function") {
                  gv.createViewerForElement(div);
                }
              }
            };

            if (document.querySelector(`script[src="${SRC}"]`)) {
              setTimeout(doRender, 10);
            } else {
              const script = document.createElement("script");
              script.src = SRC;
              script.onload = doRender;
              document.head.appendChild(script);
            }
          },
        },
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_, md) => {
        if (syncingRef.current) return;
        onChangeRef.current(md);
      });
    });

    crepeRef.current = crepe;
    return crepe;
  }, []);

  const safeReplaceAll = (md: string) => {
    const crepe = crepeRef.current;
    if (!crepe || crepe.editor.status !== EditorStatus.Created) return;
    if (crepe.getMarkdown() === md) return;
    syncingRef.current = true;
    try {
      crepe.editor.action(replaceAll(md));
    } catch {
      // ignore transient editor state
    } finally {
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    safeReplaceAll(markdown);
  }, [markdown]);

  useImperativeHandle(
    editorRef,
    () => ({
      getMarkdown: () => crepeRef.current?.getMarkdown() ?? markdown,
      setMarkdown: (md: string) => {
        safeReplaceAll(md);
      },
    }),
    [markdown]
  );

  const handleInsertFormula = (latex: string, displayMode: boolean) => {
    const md = displayMode ? `$$\n${latex}\n$$` : `$${latex}$`;
    safeReplaceAll(md);
  };

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

    useImperativeHandle(ref, () => ({
      getMarkdown: () => editorRef.current?.getMarkdown() ?? "",
      setMarkdown: (markdown: string) => editorRef.current?.setMarkdown(markdown),
    }));

    return (
      <MilkdownProvider>
        <EditorContent
          {...props}
          editorRef={editorRef}
        />
      </MilkdownProvider>
    );
  }
);

export default MilkdownEditorInner;
