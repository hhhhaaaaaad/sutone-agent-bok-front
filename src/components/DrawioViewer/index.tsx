"use client";

import { useEffect, useRef, useState } from "react";

interface DrawioViewerProps {
  xml: string;
}

const VIEWER_SCRIPT = "https://viewer.diagrams.net/js/viewer-static.min.js";

declare global {
  interface Window {
    GraphViewer?: {
      createViewerForElement?: (element: HTMLElement) => void;
      processElements?: (element?: HTMLElement) => void;
    };
  }
}

function renderGraph(element: HTMLElement) {
  const gv = window.GraphViewer;
  if (!gv) return;
  // viewer 需要异步初始化，延迟调用确保就绪
  setTimeout(() => {
    if (typeof gv.createViewerForElement === "function") {
      gv.createViewerForElement(element);
    } else if (typeof gv.processElements === "function") {
      gv.processElements();
    }
  }, 200);
}

export default function DrawioViewer({ xml }: DrawioViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const graphDiv = document.createElement("div");
    graphDiv.className = "mxgraph";
    graphDiv.style.minHeight = "300px";
    graphDiv.style.width = "100%";
    graphDiv.setAttribute(
      "data-mxgraph",
      JSON.stringify({
        highlight: "#0000ff",
        nav: true,
        resize: true,
        toolbar: "zoom layers lightbox",
        edit: "_blank",
        xml: xml,
      })
    );
    container.appendChild(graphDiv);

    const existing = document.querySelector(`script[src="${VIEWER_SCRIPT}"]`);
    if (existing) {
      renderGraph(graphDiv);
      return;
    }

    const script = document.createElement("script");
    script.src = VIEWER_SCRIPT;
    script.onload = () => {
      renderGraph(graphDiv);
    };
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, [xml]);

  if (error) {
    return (
      <details className="my-4 border rounded p-3 bg-gray-50">
        <summary className="cursor-pointer text-sm text-gray-500">
          图表 (draw.io) — 点击展开源码
        </summary>
        <pre className="mt-2 text-xs overflow-auto max-h-96">{xml}</pre>
      </details>
    );
  }

  return (
    <div
      ref={containerRef}
      className="drawio-viewer my-4 border rounded p-2 bg-white flex justify-center overflow-auto"
      style={{ minHeight: 320 }}
    />
  );
}
