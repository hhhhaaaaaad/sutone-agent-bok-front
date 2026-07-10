"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserInfo, clearUserInfo } from "@/utils/cookie";
import {
  agentApi,
  StatusChunk,
  UserChunk,
  ErrorChunk,
  PptRawChunk,
} from "@/api/agent";
import { AiAgentConfigResponseDTO } from "@/types/api";
import pptxgen from "pptxgenjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import WorkspaceHeader from "@/components/WorkspaceHeader";

// Message type definition
type MessageStep = {
  phase: string;
  label: string;
  content: string;
  status: "running" | "done" | "pending";
};

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  reasoning?: string;
  steps?: MessageStep[];
  timestamp: number;
};

// PPT Slide data structure from AI Agent
interface PptSlideElement {
  kind: "text" | "table" | "shape" | "image" | "icon" | "divider" | "bullet";
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  fill?: string;
  align?: "left" | "center" | "right";
  rows?: string[][];
  // Icon support: emoji or icon name
  icon?: string;
  // Decorative element options
  radius?: number;
  shadow?: boolean;
  opacity?: number;
  gradient?: string; // e.g. 'primary' 鈫?resolved to theme gradient
  // Line/divider options
  thickness?: number; // line thickness in inches (for divider)
  // Bullet number
  number?: number;
  // Font family override
  fontFace?: string;
  // Line spacing
  lineSpacing?: number;
  // Letter spacing
  letterSpacing?: number;
}

interface PptSlide {
  slideIndex: number;
  layout?: string;
  elements: PptSlideElement[];
}

interface PptData {
  title: string;
  slides: PptSlide[];
}

// Icons
const Icons = {
  Chat: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  Close: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Send: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  User: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Bot: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
      <path d="M4 11v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"></path>
      <path d="M9 22v-3"></path>
      <path d="M15 22v-3"></path>
    </svg>
  ),
  Download: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Sparkles: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Logout: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  Loader: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
  ),
  Plus: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Trash: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  MessageSquare: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  Square: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
    </svg>
  ),
  FilePresentation: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
};

interface Session {
  id: string;
  backendSessionId?: string;
  title: string;
  messages: Message[];
  pptData: PptData | null;
  lastModified: number;
}

export interface CustomModelConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  completionsPath: string;
  enabled: boolean;
}

// ===== Multi-Theme System =====
interface PptTheme {
  id: string;
  name: string;
  primary: string; // Main color - header/cover background
  primaryMid: string; // Slightly lighter primary
  primaryLight: string; // Light accent
  accent: string; // Highlight stripe color
  titleColor: string; // Text on dark bg
  bodyColor: string; // Body text
  subColor: string; // Subtitles
  lightGray: string;
  white: string;
  offWhite: string;
  // Cover layout proportions
  coverNavyHeight: number; // How much of the slide the top color covers (in PPT inches, out of 7.5)
  contentHeaderHeight: number; // Content page header height
}

const THEMES: PptTheme[] = [
  {
    id: "navy",
    name: "Deep Navy",
    primary: "1F3864",
    primaryMid: "2E5090",
    primaryLight: "4472C4",
    accent: "D4560A",
    titleColor: "FFFFFF",
    bodyColor: "333333",
    subColor: "666666",
    lightGray: "AAAAAA",
    white: "FFFFFF",
    offWhite: "F2F4F7",
    coverNavyHeight: 3.4,
    contentHeaderHeight: 1.3,
  },
  {
    id: "emerald",
    name: "Emerald",
    primary: "1B5E3A",
    primaryMid: "2E7D50",
    primaryLight: "4CAF6E",
    accent: "F9A825",
    titleColor: "FFFFFF",
    bodyColor: "2E3B2E",
    subColor: "5A6B5A",
    lightGray: "A0AEA0",
    white: "FFFFFF",
    offWhite: "F0F5F0",
    coverNavyHeight: 3.4,
    contentHeaderHeight: 1.3,
  },
  {
    id: "burgundy",
    name: "Burgundy",
    primary: "6B1D2A",
    primaryMid: "8E2D3E",
    primaryLight: "B84056",
    accent: "C9A84C",
    titleColor: "FFFFFF",
    bodyColor: "3B2020",
    subColor: "6B4A4A",
    lightGray: "B09090",
    white: "FFFFFF",
    offWhite: "F7F0F0",
    coverNavyHeight: 3.4,
    contentHeaderHeight: 1.3,
  },
  {
    id: "charcoal",
    name: "Charcoal",
    primary: "2C2C2C",
    primaryMid: "4A4A4A",
    primaryLight: "6A6A6A",
    accent: "E85D3A",
    titleColor: "FFFFFF",
    bodyColor: "333333",
    subColor: "666666",
    lightGray: "AAAAAA",
    white: "FFFFFF",
    offWhite: "F5F5F5",
    coverNavyHeight: 3.4,
    contentHeaderHeight: 1.3,
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: "0D47A1",
    primaryMid: "1565C0",
    primaryLight: "42A5F5",
    accent: "FF6D00",
    titleColor: "FFFFFF",
    bodyColor: "263238",
    subColor: "546E7A",
    lightGray: "90A4AE",
    white: "FFFFFF",
    offWhite: "E3F2FD",
    coverNavyHeight: 3.4,
    contentHeaderHeight: 1.3,
  },
];

// Default theme (used as fallback)
const DEFAULT_THEME = THEMES[0];

// Shape elements are now fully skipped (theme handles all decorations)

// Generate PPTX from PptData with professional theme
// Smart layout inference 鈥?ensure visual diversity even when AI doesn't specify layout
const inferLayout = (
  slideData: PptSlide,
  slideIdx: number,
  totalSlides: number,
): string => {
  let layout = slideData.layout || "";
  // Map old names to new names just in case
  if (layout === "title_slide") layout = "title_classic";
  if (layout === "content_slide") layout = "content_classic";

  const isTitleSlide = layout.startsWith("title_") || slideIdx === 0;
  const isEndSlide = layout === "end_slide" || slideIdx === totalSlides - 1;

  if (!layout) {
    if (isTitleSlide) layout = "title_classic";
    else if (isEndSlide) layout = "end_slide";
    else {
      const diverseLayouts = [
        "content_top",
        "content_classic",
        "card_3col",
        "card_2col",
        "comparison",
        "timeline",
        "data_highlight",
        "quote_slide",
      ];
      layout = diverseLayouts[(slideIdx - 1) % diverseLayouts.length];
    }
  }
  return layout;
};

/**
 * Determine if a point (x, y) is on a dark-colored area of the layout decoration.
 * Returns true if the point falls within a primary-color (dark) decorative region.
 * This replaces the fragile layout-type-based color logic with position-aware detection.
 */
const isOnDarkArea = (
  x: number,
  y: number,
  layout: string,
  theme: PptTheme,
): boolean => {
  // title_classic / end_slide: dark cover area from y=0 to y=coverNavyHeight, dark bottom bar y=7.15..7.5
  if (layout === "title_classic" || layout === "end_slide") {
    return y < theme.coverNavyHeight || y >= 7.15;
  }
  // title_center: dark bars at top 0..0.25 and bottom 7.25..7.5
  if (layout === "title_center") {
    return y < 0.25 || y >= 7.25;
  }
  // title_split: left half is dark
  if (layout === "title_split") {
    return x < 6.66;
  }
  // content_classic: left band is dark (x=0..4.5), bottom bar
  if (layout === "content_classic") {
    return x < 4.5 || y >= 7.15;
  }
  // content_top: dark header y=0..1.2, bottom bar
  if (layout === "content_top") {
    return y < 1.2 || y >= 7.15;
  }
  // card_3col: dark header y=0..0.9, bottom bar
  if (layout === "card_3col") {
    return y < 0.9 || y >= 7.15;
  }
  // card_2col: dark header y=0..0.9, bottom bar
  if (layout === "card_2col") {
    return y < 0.9 || y >= 7.15;
  }
  // comparison: dark header y=0..0.9, bottom bar
  if (layout === "comparison") {
    return y < 0.9 || y >= 7.15;
  }
  // timeline: dark left bar x=0..0.5, bottom bar
  if (layout === "timeline") {
    return x < 0.5 || y >= 7.15;
  }
  // data_highlight: dark header y=0..0.7, bottom bar
  if (layout === "data_highlight") {
    return y < 0.7 || y >= 7.15;
  }
  // quote_slide: dark left bar x=0..0.8
  if (layout === "quote_slide") {
    return x < 0.8;
  }
  // Default fallback
  return false;
};

/**
 * Get the safe content area for a layout (elements should be placed within this area).
 * Returns { x, y, w, h } in slide coordinates.
 */
const getSafeContentArea = (
  layout: string,
  theme: PptTheme,
): { x: number; y: number; w: number; h: number } => {
  const W = 13.33;
  const H = 7.5;
  const bottomBar = 0.35; // bottom bar height

  if (layout === "title_classic" || layout === "end_slide") {
    return { x: 0.5, y: 0.8, w: W - 1.0, h: theme.coverNavyHeight - 0.8 };
  }
  if (layout === "title_center") {
    return { x: 1.0, y: 0.8, w: W - 2.0, h: H - 1.6 };
  }
  if (layout === "title_split") {
    return { x: 7.2, y: 0.8, w: 5.5, h: H - 1.6 }; // Right side content area
  }
  if (layout === "content_classic") {
    return { x: 5.0, y: 0.5, w: W - 5.5, h: H - bottomBar - 0.5 };
  }
  if (layout === "content_top") {
    return { x: 0.5, y: 1.5, w: W - 1.0, h: H - bottomBar - 1.5 };
  }
  if (layout === "card_3col") {
    return { x: 0.5, y: 1.6, w: W - 1.0, h: H - bottomBar - 1.6 };
  }
  if (layout === "card_2col") {
    return { x: 1.0, y: 1.6, w: W - 2.0, h: H - bottomBar - 1.6 };
  }
  if (layout === "comparison") {
    return { x: 0.5, y: 1.5, w: W - 1.0, h: H - bottomBar - 1.5 };
  }
  if (layout === "timeline") {
    return { x: 0.8, y: 0.5, w: W - 1.3, h: H - bottomBar - 0.5 };
  }
  if (layout === "data_highlight") {
    return { x: 0.8, y: 1.0, w: W - 1.3, h: H - bottomBar - 1.0 };
  }
  if (layout === "quote_slide") {
    return { x: 1.5, y: 1.0, w: W - 2.0, h: H - bottomBar - 1.0 };
  }
  // Default: entire slide minus small margins
  return { x: 0.5, y: 0.5, w: W - 1.0, h: H - bottomBar - 0.5 };
};

// --- PPT Data Normalization (shared) ---
const stripMdCodeBlock = (s: string): string =>
  s
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

const normalizePptSlide = (slide: any): PptSlide => {
  const metaKeys = new Set([
    "kind",
    "x",
    "y",
    "w",
    "h",
    "fontSize",
    "color",
    "bold",
    "fill",
    "align",
    "rows",
    "type",
    "layout",
    "slideIndex",
    "fontFace",
    "italic",
    "underline",
    "icon",
    "number",
    "radius",
    "shadow",
    "opacity",
    "gradient",
    "thickness",
    "lineSpacing",
    "letterSpacing",
  ]);
  return {
    ...slide,
    elements: (slide.elements || []).map((el: any) => {
      // Normalize content field
      if (
        el.content === undefined ||
        el.content === null ||
        el.content === ""
      ) {
        el.content =
          el.text ||
          el.value ||
          el.label ||
          el.body ||
          el.title ||
          el.message ||
          "";
        if (!el.content) {
          for (const key of Object.keys(el)) {
            if (
              !metaKeys.has(key) &&
              typeof el[key] === "string" &&
              el[key].length > 0
            ) {
              el.content = el[key];
              break;
            }
          }
        }
      }
      // Normalize kind
      if (!el.kind) {
        if (el.rows && Array.isArray(el.rows)) el.kind = "table";
        else if (el.icon && !el.content) el.kind = "icon";
        else if (
          el.content &&
          el.content.startsWith("http") &&
          /\.(png|jpg|jpeg|gif|svg|webp)/i.test(el.content)
        )
          el.kind = "image";
        else if (el.content) el.kind = "text";
        else if (el.fill) el.kind = "shape";
        else el.kind = "text";
      }
      if (el.kind === "icon" && !el.content && el.icon) el.content = el.icon;
      return el;
    }),
  };
};

const normalizePptData = (data: PptData): PptData => {
  return {
    ...data,
    slides: data.slides.map(normalizePptSlide),
  };
};

const tryParsePpt = (raw: unknown): PptData | null => {
  try {
    let parsedObj: any = null;
    if (typeof raw === "string") {
      let clean = stripMdCodeBlock(raw);
      if (clean.match(/\}\s*\{/)) {
        try {
          const arr = JSON.parse(`[${clean.replace(/\}\s*\{/g, "},{")}]`);
          parsedObj =
            arr.find(
              (item: any) => item.type === "ppt" || (item.slides && item.title),
            ) || arr[arr.length - 1];
        } catch (e) {}
      }
      if (!parsedObj) {
        parsedObj = JSON.parse(clean);
      }
    } else {
      parsedObj = raw;
    }
    const findPptData = (obj: any, depth: number = 0): PptData | null => {
      if (obj === null || obj === undefined || depth > 8) return null;
      if (obj.title && Array.isArray(obj.slides)) return obj as PptData;
      if (Array.isArray(obj.slides) && obj.slides.length > 0)
        return obj as PptData;
      const keys = ["content", "data", "result", "output", "response", "body"];
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
          const inner =
            typeof obj[key] === "string"
              ? (() => {
                  try {
                    return JSON.parse(stripMdCodeBlock(obj[key]));
                  } catch {
                    return null;
                  }
                })()
              : obj[key];
          if (inner) {
            const found = findPptData(inner, depth + 1);
            if (found) return found;
          }
        }
      }
      return null;
    };
    return findPptData(parsedObj);
  } catch {
    return null;
  }
};

/**
 * Try to extract completed slides from a partially accumulated JSON string.
 * Uses a bracket-matching approach to find the deepest complete JSON prefix.
 */
const tryExtractPartialSlides = (accumulated: string): PptSlide[] | null => {
  try {
    const clean = stripMdCodeBlock(accumulated);
    // First, try direct full parse
    try {
      const fullParsed = JSON.parse(clean);
      const pptData = tryParsePpt(fullParsed);
      if (pptData && pptData.slides && pptData.slides.length > 0) {
        return pptData.slides;
      }
    } catch {}

    // Partial parse: find the "slides" array and extract complete entries
    const slidesStart = clean.indexOf('"slides"');
    if (slidesStart < 0) return null;

    // Find the opening bracket of the slides array
    const arrayStart = clean.indexOf("[", slidesStart);
    if (arrayStart < 0) return null;

    // Scan for complete slide objects (each starts with { and has "slideIndex")
    const completeSlides: PptSlide[] = [];
    let searchFrom = arrayStart + 1;
    let depth = 0;
    let slideStart = -1;

    for (let i = arrayStart + 1; i < clean.length; i++) {
      const ch = clean[i];
      if (ch === "{") {
        if (depth === 0) slideStart = i;
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && slideStart >= 0) {
          // We have a complete top-level object
          const objStr = clean.substring(slideStart, i + 1);
          try {
            const slideObj = JSON.parse(objStr);
            if (
              slideObj &&
              (slideObj.slideIndex !== undefined || slideObj.elements)
            ) {
              completeSlides.push(slideObj);
            }
          } catch {}
          slideStart = -1;
        }
      }
    }

    return completeSlides.length > 0 ? completeSlides : null;
  } catch {
    return null;
  }
};

const generatePptx = (data: PptData, theme: PptTheme) => {
  const pres = new pptxgen();
  pres.title = data.title;
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

  data.slides.forEach((slideData, slideIdx) => {
    const slide = pres.addSlide();
    const layout = inferLayout(slideData, slideIdx, data.slides.length);
    const isTitleSlide = layout.startsWith("title_") || slideIdx === 0;
    const isEndSlide =
      layout === "end_slide" || slideIdx === data.slides.length - 1;

    // === STEP 1: Layout-specific theme decoration ===
    // Helper: add rectangle shape (with optional gradient)
    const addRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
      gradient?: { from: string; to: string },
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (gradient) {
        slide.addShape((pres as any).shapes.RECTANGLE, {
          x,
          y,
          w,
          h,
          fill: { color: gradient.from },
          line: { width: 0 },
        });
        // Overlay with semi-transparent gradient effect using second shape
        slide.addShape((pres as any).shapes.RECTANGLE, {
          x,
          y,
          w,
          h,
          fill: { color: gradient.to, transparency: 50 },
          line: { width: 0 },
        });
      } else {
        slide.addShape((pres as any).shapes.RECTANGLE, {
          x,
          y,
          w,
          h,
          fill: { color },
          line: { width: 0 },
        });
      }
    };
    // Helper: add circle shape
    const addCircle = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
      transparency = 0,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slide.addShape((pres as any).shapes.OVAL, {
        x,
        y,
        w,
        h,
        fill: { color, transparency },
        line: { width: 0 },
      });
    };

    // Gradient shortcut
    const grad = { from: theme.primary, to: theme.primaryMid };

    if (layout === "title_classic" || layout === "end_slide") {
      addRect(0, 0, 13.33, theme.coverNavyHeight, theme.primary, grad);
      addRect(0, theme.coverNavyHeight, 13.33, 0.12, theme.accent);
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
      addCircle(10.5, 0.6, 2.2, 2.2, theme.primaryLight, 70);
      addCircle(0.3, 4.8, 1.4, 1.4, theme.primaryLight, 85);
    } else if (layout === "title_center") {
      addRect(0, 0, 13.33, 0.25, theme.primary, grad);
      addRect(0, 7.25, 13.33, 0.25, theme.primary, grad);
      addRect(0, 0.25, 13.33, 0.05, theme.accent);
      addRect(0, 7.2, 13.33, 0.05, theme.accent);
      addCircle(5.16, 2.25, 3.0, 3.0, theme.offWhite, 60);
    } else if (layout === "title_split") {
      addRect(0, 0, 6.66, 7.5, theme.primary, grad);
      addRect(6.66, 0, 6.67, 7.5, theme.offWhite);
      addRect(6.66, 0, 0.1, 7.5, theme.accent);
      addCircle(1.0, 5.0, 1.8, 1.8, theme.primaryLight, 80);
    } else if (layout === "card_3col") {
      addRect(0, 0, 13.33, 0.9, theme.primary, grad);
      addRect(0, 0.9, 13.33, 0.06, theme.accent);
      addRect(0.5, 1.6, 3.8, 5.0, theme.offWhite);
      addRect(4.75, 1.6, 3.8, 5.0, theme.offWhite);
      addRect(9.0, 1.6, 3.8, 5.0, theme.offWhite);
      addRect(0.5, 1.6, 3.8, 0.12, theme.primary, grad);
      addRect(4.75, 1.6, 3.8, 0.12, theme.primary, grad);
      addRect(9.0, 1.6, 3.8, 0.12, theme.primary, grad);
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
    } else if (layout === "comparison") {
      addRect(0, 0, 13.33, 0.9, theme.primary, grad);
      addRect(0, 0.9, 13.33, 0.06, theme.accent);
      addRect(0.5, 1.5, 5.9, 5.2, theme.offWhite);
      addRect(0.5, 1.5, 5.9, 0.1, theme.primary, grad);
      addRect(6.9, 1.5, 5.9, 5.2, theme.offWhite);
      addRect(6.9, 1.5, 5.9, 0.1, theme.accent);
      addRect(6.55, 1.5, 0.2, 5.2, theme.primaryLight, {
        from: theme.primaryLight,
        to: theme.primaryMid,
      });
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
    } else if (layout === "timeline") {
      addRect(0, 0, 0.5, 7.5, theme.primary, grad);
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
      addRect(1.2, 3.5, 11.5, 0.12, theme.primaryLight);
      addCircle(2.5, 3.2, 0.7, 0.7, theme.primary);
      addCircle(5.5, 3.2, 0.7, 0.7, theme.primary);
      addCircle(8.5, 3.2, 0.7, 0.7, theme.primary);
      addCircle(11.5, 3.2, 0.7, 0.7, theme.accent);
    } else if (layout === "data_highlight") {
      addRect(0, 0, 13.33, 0.7, theme.primary, grad);
      addRect(0, 0.7, 13.33, 0.06, theme.accent);
      addRect(0, 6.0, 13.33, 1.5, theme.offWhite);
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
      addRect(0.5, 1.2, 0.08, 4.5, theme.primary);
    } else if (layout === "quote_slide") {
      addRect(0, 0, 13.33, 7.5, theme.offWhite);
      addRect(0, 0, 0.8, 7.5, theme.primary, grad);
      addRect(0.8, 2.8, 0.12, 1.8, theme.accent);
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
    } else if (layout === "card_2col") {
      addRect(0, 0, 13.33, 0.9, theme.primary, grad);
      addRect(0, 0.9, 13.33, 0.06, theme.accent);
      addRect(1.0, 1.6, 5.0, 5.0, theme.offWhite);
      addRect(7.33, 1.6, 5.0, 5.0, theme.offWhite);
      addRect(1.0, 1.6, 5.0, 0.15, theme.primary, grad);
      addRect(7.33, 1.6, 5.0, 0.15, theme.primary, grad);
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
    } else if (layout === "content_top") {
      addRect(0, 0, 13.33, 1.2, theme.primary, grad);
      addRect(0, 1.2, 13.33, 0.08, theme.accent);
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
    } else {
      addRect(0, 0, 4.5, 7.15, theme.primary, grad);
      addRect(4.5, 0, 0.08, 7.15, theme.accent);
      addRect(0, 7.15, 13.33, 0.35, theme.primary, grad);
    }

    // === STEP 2: Render AI content elements (skip all shapes) ===
    slideData.elements.forEach((el) => {
      if (el.kind === "shape") return;

      // Safe content area clamping (shared by all element types)
      const safe = getSafeContentArea(layout, theme);

      switch (el.kind) {
        case "text": {
          const textFontSize = el.fontSize || 18;
          const elX = Math.max(
            safe.x,
            Math.min(el.x || 0, safe.x + safe.w - (el.w || 2)),
          );
          const elY = Math.max(
            safe.y,
            Math.min(el.y || 0, safe.y + safe.h - (el.h || 1)),
          );
          // Position-aware color detection
          const elCenterX = elX + (el.w || 4) / 2;
          const elCenterY = elY + (el.h || 1) / 2;
          const onDark = isOnDarkArea(elCenterX, elCenterY, layout, theme);
          let textColor = onDark ? theme.white : theme.bodyColor;

          // Title text (fontSize >= 24) gets primary color on light areas
          if (textFontSize >= 24) {
            textColor = onDark ? theme.white : theme.primary;
          }
          // Large decorative text (big numbers etc): allow AI color choice
          if (el.color && textFontSize >= 30) {
            textColor = el.color;
          }

          const lines = (el.content || "").split("\n");
          const textParts = lines.map((line) => {
            const trimmed = line.trim();
            const isBullet =
              trimmed.startsWith("\u2022") ||
              trimmed.startsWith("-") ||
              trimmed.startsWith("\u00b7");
            return {
              text: isBullet ? "  " + trimmed : trimmed,
              options: {
                fontSize: textFontSize,
                color: textColor,
                bold: el.bold || false,
                breakType: "none" as const,
                paraSpaceAfter: textFontSize < 22 ? 8 : 4,
                paraSpaceBefore: 2,
              },
            };
          });

          slide.addText(textParts, {
            x: elX,
            y: elY,
            w: el.w,
            h: el.h,
            fill: el.fill ? { color: el.fill } : undefined,
            align: el.align || "left",
            valign: textFontSize >= 30 ? "middle" : "top",
            lineSpacingMultiple: textFontSize < 22 ? 1.5 : 1.2,
            fontFace:
              textFontSize >= 24 ? "Microsoft YaHei" : "Microsoft YaHei",
          });
          break;
        }

        case "table": {
          try {
            const tblX = Math.max(safe.x, el.x || 0);
            const tblY = Math.max(safe.y, el.y || 0);
            const safeRows = Array.isArray(el.rows)
              ? el.rows.filter((r: any) => Array.isArray(r) && r.length > 0)
              : [];
            if (safeRows.length > 0 && (el.w || 0) > 0) {
              const colCount = safeRows[0].length || 1;
              const tableRows = safeRows.map((row: any, rowIdx: number) =>
                row.map((cell: any) => ({
                  text: String(cell ?? ""),
                  options: {
                    fontSize: 12,
                    color: rowIdx === 0 ? theme.white : theme.bodyColor,
                    align: "center" as const,
                    valign: "middle" as const,
                    fill: {
                      color:
                        rowIdx === 0
                          ? theme.primary
                          : rowIdx % 2 === 0
                            ? theme.offWhite
                            : theme.white,
                    },
                    bold: rowIdx === 0,
                    border: { pt: 0.5, color: "C0C8D4" },
                  },
                })),
              );
              slide.addTable(tableRows, {
                x: tblX,
                y: tblY,
                w: el.w,
                h: el.h || 2,
                border: { pt: 1, color: "C0C8D4" },
                colW: el.w / colCount,
                rowH: 0.45,
                autoPage: true,
              });
            }
          } catch (e) {
            // Skip invalid table elements gracefully
            console.warn("Skipping invalid table element:", e);
          }
          break;
        }

        case "image":
          try {
            const imgX = Math.max(safe.x, el.x || 0);
            const imgY = Math.max(safe.y, el.y || 0);
            slide.addImage({
              path: el.content,
              x: imgX,
              y: imgY,
              w: el.w,
              h: el.h,
            });
          } catch {
            /* skip */
          }
          break;

        case "icon": {
          const iconFontSize = el.fontSize || 32;
          const iconX = Math.max(safe.x, el.x || 0);
          const iconY = Math.max(safe.y, el.y || 0);
          slide.addText(el.icon || el.content || "•", {
            x: iconX,
            y: iconY,
            w: el.w,
            h: el.h,
            fontSize: iconFontSize,
            color: el.color || theme.primary,
            align: "center",
            valign: "middle",
          });
          break;
        }

        case "divider": {
          const isH = (el.w || 0) > (el.h || 0);
          const divX = Math.max(safe.x, el.x || 0);
          const divY = Math.max(safe.y, el.y || 0);
          if (isH) {
            addRect(
              divX,
              divY,
              el.w || 1,
              el.thickness || 0.04,
              el.color || "AAAAAA",
            );
          } else {
            addRect(
              divX,
              divY,
              el.thickness || 0.04,
              el.h || 1,
              el.color || "AAAAAA",
            );
          }
          break;
        }

        case "bullet": {
          const bulletFontSize = el.fontSize || 16;
          const numSize = Math.max(10, bulletFontSize * 0.65);
          const circleW = 0.45;
          const bulX = Math.max(safe.x, el.x || 0);
          const bulY = Math.max(safe.y, el.y || 0);
          addCircle(bulX, bulY, circleW, circleW, el.fill || theme.primary);
          slide.addText(String(el.number ?? 1), {
            x: bulX,
            y: bulY,
            w: circleW,
            h: circleW,
            fontSize: numSize,
            color: theme.white,
            bold: true,
            align: "center",
            valign: "middle",
          });
          slide.addText(el.content || "", {
            x: bulX + circleW + 0.15,
            y: bulY,
            w: (el.w || 5) - circleW - 0.15,
            h: el.h || 0.6,
            fontSize: bulletFontSize,
            color: el.color || theme.bodyColor,
            bold: el.bold || false,
            align: "left",
            valign: "middle",
            lineSpacingMultiple: 1.4,
          });
          break;
        }
      }
    });

    // === STEP 3: Page number ===
    if (!isTitleSlide && !isEndSlide) {
      slide.addText(`${slideIdx + 1} / ${data.slides.length}`, {
        x: 11.5,
        y: 7.15,
        w: 1.5,
        h: 0.35,
        fontSize: 10,
        color: theme.white,
        align: "right",
        valign: "middle",
      });
    }
  });

  return pres;
};

export default function PptPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState("");

  // (inferLayout defined at module level above)

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "agent",
      content:
        "浣犲ソ锛佹垜鏄綘鐨勬紨绀虹鏅鸿兘鍔╂墜銆傝鍛婅瘔鎴戜綘鎯冲埗浣滀粈涔堜富棰樼殑婕旂ず绋匡紵",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stream State
  const [streamPhase, setStreamPhase] = useState<string>("");
  const [streamProgress, setStreamProgress] = useState<string>("");
  const streamAbortRef = useRef<AbortController | null>(null);

  // Agent State
  const [agents, setAgents] = useState<AiAgentConfigResponseDTO[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [sessionId, setSessionId] = useState("");

  // PPT Preview State
  const [pptData, setPptData] = useState<PptData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("navy");
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [selectedStructure, setSelectedStructure] = useState("auto");
  const [selectedTone, setSelectedTone] = useState("neutral");
  const [selectedScene, setSelectedScene] = useState("general");
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>(["auto"]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "business",
  );
  const [leftTab, setLeftTab] = useState<"templates" | "slides">("templates");

  // ===== PPT Template Library =====
  const PPT_TEMPLATES = [
    {
      category: "business",
      icon: "Briefcase",
      label: "商务办公",
      templates: [
        {
          id: "quarterly-report",
          name: "季度工作汇报",
          desc: "项目进展、关键数据与下季度规划",
          prompt:
            "Create a 9-slide quarterly business review presentation with a cover, KPI overview, milestone progress, wins, risks, team updates, roadmap, resource requests, and closing slide.",
          scene: "report",
          style: "professional",
        },
        {
          id: "annual-review",
          name: "年度总结报告",
          desc: "全年复盘、成果亮点与来年目标",
          prompt:
            "Create a 10-slide annual review deck covering year overview, key metrics, major milestones, product achievements, organization updates, lessons learned, and next-year priorities.",
          scene: "report",
          style: "professional",
        },
        {
          id: "project-proposal",
          name: "项目立项方案",
          desc: "背景、目标、方案、预算与排期",
          prompt:
            "Create a 9-slide project proposal presentation including problem statement, goals, solution design, implementation plan, budget, risks, and expected outcomes.",
          scene: "report",
          style: "professional",
        },
      ],
    },
    {
      category: "roadshow",
      icon: "Rocket",
      label: "路演融资",
      templates: [
        {
          id: "startup-pitch",
          name: "创业融资路演",
          desc: "痛点、方案、市场、增长与融资计划",
          prompt:
            "Create an 11-slide startup pitch deck with problem, solution, market size, product demo, traction, business model, competition, team, financials, and fundraising ask.",
          scene: "pitch",
          style: "creative",
        },
        {
          id: "investor-deck",
          name: "Investor Update",
          desc: "核心指标、增长飞轮与未来预测",
          prompt:
            "Create a 9-slide investor update deck focused on ARR growth, unit economics, retention, growth loops, market position, and next milestones.",
          scene: "pitch",
          style: "professional",
        },
      ],
    },
    {
      category: "education",
      icon: "GraduationCap",
      label: "培训教学",
      templates: [
        {
          id: "tech-sharing",
          name: "技术分享",
          desc: "架构演进、最佳实践与经验复盘",
          prompt:
            "Create a 10-slide technical sharing deck about migrating from a monolith to microservices, including pain points, architecture changes, lessons learned, and measurable outcomes.",
          scene: "training",
          style: "academic",
        },
        {
          id: "course-lecture",
          name: "课程讲义",
          desc: "知识框架、核心概念与案例说明",
          prompt:
            "Create a 10-slide lecture deck with learning objectives, key concepts, examples, exercises, and recap for an introductory course.",
          scene: "training",
          style: "academic",
        },
      ],
    },
    {
      category: "data",
      icon: "BarChart3",
      label: "数据报告",
      templates: [
        {
          id: "data-dashboard",
          name: "数据看板报告",
          desc: "关键指标、趋势变化与风险预警",
          prompt:
            "Create an 8-slide monthly data report presentation with KPI summary, trend charts, channel analysis, cohort insights, campaign results, risks, and next actions.",
          scene: "report",
          style: "professional",
        },
        {
          id: "competitive-analysis",
          name: "竞品分析",
          desc: "产品对比、差异定位与策略建议",
          prompt:
            "Create an 8-slide competitive analysis deck comparing product positioning, capabilities, pricing, differentiation, SWOT, and strategic recommendations.",
          scene: "report",
          style: "professional",
        },
      ],
    },
    {
      category: "personal",
      icon: "UserRound",
      label: "个人成长",
      templates: [
        {
          id: "resume",
          name: "Resume",
          desc: "教育、经历、技能与项目成果",
          prompt:
            "Create a 6-slide resume presentation for a senior software engineer, covering profile, experience, skills, flagship projects, achievements, and contact details.",
          scene: "general",
          style: "minimal",
        },
        {
          id: "year-review",
          name: "个人年度回顾",
          desc: "成就、学习收获与新年计划",
          prompt:
            "Create a 7-slide personal year-in-review deck covering achievements, growth, books, skills, memorable moments, and next-year plans.",
          scene: "general",
          style: "creative",
        },
      ],
    },
  ];

  // Style Options
  const STYLE_OPTIONS = [
    { id: "professional", label: "Professional" },
    { id: "creative", label: "Creative" },
    { id: "academic", label: "Academic" },
    { id: "minimal", label: "Minimal" },
  ];
  const STRUCTURE_OPTIONS = [
    { id: "auto", label: "Auto" },
    { id: "title-only", label: "Title Only" },
    { id: "full", label: "Full Content" },
    { id: "concise", label: "Concise" },
  ];
  const TONE_OPTIONS = [
    { id: "neutral", label: "Neutral" },
    { id: "warm", label: "Warm" },
    { id: "cool", label: "Cool" },
    { id: "vivid", label: "Vivid" },
  ];
  const SCENE_OPTIONS = [
    { id: "general", label: "General" },
    { id: "report", label: "Report" },
    { id: "pitch", label: "Pitch" },
    { id: "training", label: "Training" },
  ];
  const LAYOUT_OPTIONS = [
    { id: "auto", label: "Auto", desc: "Let AI choose the slide structure" },
    { id: "title_classic", label: "Classic Cover", desc: "Top-bottom cover composition" },
    { id: "title_center", label: "Centered Cover", desc: "Minimal centered headline cover" },
    { id: "title_split", label: "Split Cover", desc: "50/50 split-color cover layout" },
    { id: "content_classic", label: "Classic Content", desc: "Sidebar-led content layout" },
    { id: "content_top", label: "Topbar Content", desc: "Horizontal header content layout" },
    { id: "card_3col", label: "3-Column Cards", desc: "Three equal information cards" },
    { id: "card_2col", label: "2-Column Cards", desc: "Two larger content cards" },
    { id: "comparison", label: "Comparison", desc: "Left-right comparison layout" },
    { id: "data_highlight", label: "Data Highlight", desc: "Spotlight core metrics and trends" },
    { id: "timeline", label: "Timeline", desc: "Flow and milestone layout" },
  ];
  const activeTheme =
    THEMES.find((t) => t.id === selectedThemeId) || DEFAULT_THEME;

  // Session State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Custom API Config State
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [customModels, setCustomModels] = useState<CustomModelConfig[]>([]);
  const [selectedCustomModelId, setSelectedCustomModelId] =
    useState<string>("default");
  const [editingModel, setEditingModel] = useState<CustomModelConfig | null>(
    null,
  );

  // Rename State (missing in original, adding for consistency if needed, but wait, if it's not used I won't add it to avoid errors)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check Login & Load Agents
  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.user) {
      router.push("/login");
      return;
    }
    setCurrentUser(userInfo.user);

    // Load Custom Models
    const savedModels = localStorage.getItem("ai_agent_custom_models");
    if (savedModels) {
      try {
        setCustomModels(JSON.parse(savedModels));
      } catch (e) {}
    }
    const savedSelected = localStorage.getItem("ai_agent_selected_model");
    if (savedSelected) {
      setSelectedCustomModelId(savedSelected);
    }

    const loadAgents = async () => {
      try {
        const res = await agentApi.queryAiAgentConfigList();
        setAgents(res.data || []);
        if (res.data && res.data.length > 0) {
          // Prefer PPT agent if available, otherwise first
          const pptAgent = res.data.find(
            (a) => a.agentName?.includes("PPT") || a.agentDesc?.includes("PPT"),
          );
          const lastAgentId = localStorage.getItem("ai_ppt_last_agent");
          if (lastAgentId && res.data.find((a) => a.agentId === lastAgentId)) {
            setSelectedAgentId(lastAgentId);
          } else if (pptAgent) {
            setSelectedAgentId(pptAgent.agentId);
          } else {
            setSelectedAgentId(res.data[0].agentId);
          }
        }
      } catch (error) {
        console.error("Failed to load agents:", error);
      }
    };
    loadAgents();
  }, [router]);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem("ppt_sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          const mostRecent = parsed.sort(
            (a: Session, b: Session) => b.lastModified - a.lastModified,
          )[0];
          setCurrentSessionId(mostRecent.id);
          setMessages(mostRecent.messages);
          if (mostRecent.pptData) {
            setPptData(mostRecent.pptData);
          }
        } else {
          createNewSession(true);
        }
      } catch {
        createNewSession(true);
      }
    } else {
      createNewSession(true);
    }
  }, []);

  // Save sessions
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("ppt_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Update session messages
  useEffect(() => {
    if (currentSessionId) {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages,
              backendSessionId: sessionId,
              title:
                session.title === "新建演示稿" &&
                messages.find((m) => m.role === "user")
                  ? messages
                      .find((m) => m.role === "user")
                      ?.content.slice(0, 20) || "新建演示稿"
                  : session.title,
            };
          }
          return session;
        }),
      );
    }
  }, [messages, currentSessionId, sessionId]);

  const createNewSession = (isInitial = false, backendId = "") => {
    const newSession: Session = {
      id: Date.now().toString(),
      backendSessionId: backendId,
      title: "新建演示稿",
      messages: [
        {
          id: Date.now().toString(),
          role: "agent",
          content:
            "浣犲ソ锛佹垜鏄綘鐨勬紨绀虹鏅鸿兘鍔╂墜銆傝鍛婅瘔鎴戜綘鎯冲埗浣滀粈涔堜富棰樼殑婕旂ず绋匡紵",
          timestamp: Date.now(),
        },
      ],
      pptData: null,
      lastModified: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    setSessionId(backendId);
    setPptData(null);
    setCurrentSlideIndex(0);
  };

  const handleSwitchSession = (targetSessionId: string) => {
    if (targetSessionId === currentSessionId) return;
    const session = sessions.find((s) => s.id === targetSessionId);
    if (session) {
      setCurrentSessionId(targetSessionId);
      setMessages(session.messages);
      setSessionId(session.backendSessionId || "");
      setPptData(session.pptData);
      setCurrentSlideIndex(0);
    }
  };

  const saveCustomModels = (models: CustomModelConfig[]) => {
    setCustomModels(models);
    localStorage.setItem("ai_agent_custom_models", JSON.stringify(models));
  };

  const handleAddNewModel = () => {
    setEditingModel({
      id: Date.now().toString(),
      name: "New Model",
      baseUrl: "https://api.openai.com",
      apiKey: "",
      model: "gpt-4o",
      completionsPath: "v1/chat/completions",
      enabled: true,
    });
  };

  const handleSaveEditingModel = () => {
    if (!editingModel) return;
    const exists = customModels.some((m) => m.id === editingModel.id);
    let newModels;
    if (exists) {
      newModels = customModels.map((m) =>
        m.id === editingModel.id ? editingModel : m,
      );
    } else {
      newModels = [...customModels, editingModel];
    }
    saveCustomModels(newModels);
    setSelectedCustomModelId(editingModel.id);
    localStorage.setItem("ai_agent_selected_model", editingModel.id);
    setEditingModel(null);
  };

  const handleDeleteModel = (id: string) => {
    const newModels = customModels.filter((m) => m.id !== id);
    saveCustomModels(newModels);
    if (selectedCustomModelId === id) {
      setSelectedCustomModelId("default");
      localStorage.setItem("ai_agent_selected_model", "default");
    }
  };

  const handleDeleteSession = (
    e: React.MouseEvent,
    sessionIdToDelete: string,
  ) => {
    e.stopPropagation();
    const newSessions = sessions.filter((s) => s.id !== sessionIdToDelete);
    setSessions(newSessions);
    localStorage.setItem("ppt_sessions", JSON.stringify(newSessions));
    if (currentSessionId === sessionIdToDelete) {
      if (newSessions.length > 0) {
        handleSwitchSession(newSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const handleLogout = () => {
    clearUserInfo();
    router.push("/login");
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentId = e.target.value;
    setSelectedAgentId(newAgentId);
    setSessionId("");
    localStorage.setItem("ai_ppt_last_agent", newAgentId);
  };

  const handleStopStream = () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
    setIsSending(false);
    setStreamPhase("");
    setStreamProgress("");
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "agent",
        content: "Generation stopped.",
        timestamp: Date.now(),
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue;
    setInputValue("");
    setIsSending(true);

    const textarea = document.querySelector("textarea");
    if (textarea) textarea.style.height = "80px";

    // Build style hints from control panel selections
    const styleHints: string[] = [];
    const styleLabel =
      STYLE_OPTIONS.find((o) => o.id === selectedStyle)?.label || selectedStyle;
    const structureLabel =
      STRUCTURE_OPTIONS.find((o) => o.id === selectedStructure)?.label ||
      selectedStructure;
    const toneLabel =
      TONE_OPTIONS.find((o) => o.id === selectedTone)?.label || selectedTone;
    const sceneLabel =
      SCENE_OPTIONS.find((o) => o.id === selectedScene)?.label || selectedScene;
    styleHints.push(`椋庢牸=${styleLabel}`);
    styleHints.push(`缁撴瀯=${structureLabel}`);
    styleHints.push(`鑹茶皟=${toneLabel}`);
    styleHints.push(`鍦烘櫙=${sceneLabel}`);
    if (!selectedLayouts.includes("auto") && selectedLayouts.length > 0) {
      const layoutLabels = selectedLayouts
        .map((id) => LAYOUT_OPTIONS.find((o) => o.id === id)?.label || id)
        .join(" / ");
      styleHints.push(`甯冨眬=${layoutLabels}`);
    }
    const enrichedContent = `[璁捐鎸囦护: ${styleHints.join(", ")}]

${content}`;

    if (!selectedAgentId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "agent",
          content: "Please select an agent first.",
          timestamp: Date.now(),
        },
      ]);
      setIsSending(false);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const agentMsgId = Date.now().toString() + "-agent";
    const initialAgentMsg: Message = {
      id: agentMsgId,
      role: "agent",
      content: "",
      reasoning: "",
      steps: [],
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, initialAgentMsg]);

    try {
      // Ensure session
      let activeBackendSessionId = sessionId;
      if (!activeBackendSessionId) {
        const sessionRes = await agentApi.createSession(
          selectedAgentId,
          currentUser,
        );
        activeBackendSessionId = sessionRes.data.sessionId;
        setSessionId(activeBackendSessionId);
      }

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            return { ...session, lastModified: Date.now() };
          }
          return session;
        }),
      );

      // --- Streaming PPT generation ---
      let accumulatedText = "";
      let streamPhaseStr: string = "analyzing";
      let renderedSlideCount = 0;
      let pptTitle = "";
      const currentSessionIdRef = currentSessionId;

      let accumulatedReasoning = "";
      let accumulatedContent = "";
      let accumulatedSteps: MessageStep[] = [];

      setStreamPhase("analyzing");
      setStreamProgress("姝ｅ湪鍒嗘瀽闇€姹?..");

      const updateStep = (
        phaseStr: string,
        phaseText: string,
        contentToAdd: string,
        isDone: boolean = false,
      ) => {
        const stepIndex = accumulatedSteps.findIndex(
          (s) => s.phase === phaseStr,
        );
        if (stepIndex >= 0) {
          if (contentToAdd) {
            accumulatedSteps[stepIndex].content += contentToAdd + "\n";
          }
          if (isDone) {
            accumulatedSteps[stepIndex].status = "done";
          }
        } else {
          accumulatedSteps.forEach((s) => {
            if (s.status === "running") s.status = "done";
          });
          accumulatedSteps.push({
            phase: phaseStr,
            label: phaseText,
            content: contentToAdd ? contentToAdd + "\n" : "",
            status: isDone ? "done" : "running",
          });
        }
      };

      const activeModelConfig = customModels.find(
        (m) => m.id === selectedCustomModelId && m.enabled,
      );

      const controller = await agentApi.chatStream(
        {
          agentId: selectedAgentId,
          userId: currentUser,
          sessionId: activeBackendSessionId,
          message: enrichedContent,
          customBaseUrl: activeModelConfig?.baseUrl || undefined,
          customApiKey: activeModelConfig?.apiKey || undefined,
          customCompletionsPath:
            activeModelConfig?.completionsPath || undefined,
          customModel: activeModelConfig?.model || undefined,
        },
        (event) => {
          const { phase, chunk } = event;

          const phaseLabel: Record<string, string> = {
            analyzing: "Analyzing request",
            drawing: "馃帹 鐢熸垚鍐呭",
            generating: "馃帹 鐢熸垚鍐呭",
            reviewing: "Reviewing output",
            thinking: "馃 鎬濊€冧腑",
          };
          const currentPhaseLabel = phaseLabel[phase] || phaseLabel.thinking;

          if (phase !== "done" && phase !== "error") {
            setStreamPhase(phase);
            streamPhaseStr = phase;
            updateStep(phase, currentPhaseLabel, "");
          }

          if (chunk.type === "ppt_raw") {
            const rawContent = (chunk as PptRawChunk).raw || "";
            accumulatedText += rawContent;

            const partialSlides = tryExtractPartialSlides(accumulatedText);
            if (partialSlides && partialSlides.length > renderedSlideCount) {
              const newSlides = partialSlides.map(normalizePptSlide);
              const titleMatch = accumulatedText.match(
                /"title"\s*:\s*"([^"]+)"/,
              );
              if (titleMatch) pptTitle = titleMatch[1];

              setPptData({ title: pptTitle || "PPT", slides: newSlides });
              renderedSlideCount = newSlides.length;
            }
            setStreamProgress(`宸叉覆鏌?${renderedSlideCount} 椤?..`);
          } else if (chunk.type === "status") {
            const statusContent = (chunk as StatusChunk).content || "";
            accumulatedText += statusContent;

            const text = statusContent.trim();
            if (
              text !== "}" &&
              text !== "{" &&
              text !== "]" &&
              text !== "[" &&
              !text.startsWith("```") &&
              !text.startsWith('"type":') &&
              !text.startsWith('"id":') &&
              !text.includes('"ppt_raw"')
            ) {
              if (!accumulatedReasoning.endsWith(text + "\n")) {
                accumulatedReasoning += statusContent + "\n";
              }
              updateStep(phase, currentPhaseLabel, statusContent);
              setStreamProgress(text.substring(0, 50) + "...");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        reasoning: accumulatedReasoning,
                        steps: [...accumulatedSteps],
                      }
                    : m,
                ),
              );
            }

            const partialSlides = tryExtractPartialSlides(accumulatedText);
            if (partialSlides && partialSlides.length > renderedSlideCount) {
              const newSlides = partialSlides.map(normalizePptSlide);
              const titleMatch = accumulatedText.match(
                /"title"\s*:\s*"([^"]+)"/,
              );
              if (titleMatch) pptTitle = titleMatch[1];
              setPptData({ title: pptTitle || "PPT", slides: newSlides });
              renderedSlideCount = newSlides.length;
            }
          } else if (chunk.type === "user") {
            const text = (chunk as UserChunk).content || "";
            let displayContent = text;
            if (
              text.startsWith("{") &&
              text.includes('"type"') &&
              text.includes('"user"')
            ) {
              try {
                const parsed = JSON.parse(text);
                if (parsed.content) displayContent = parsed.content;
              } catch (e) {}
            }
            const padding =
              accumulatedContent && !accumulatedContent.endsWith("\n\n")
                ? "\n\n"
                : "";
            accumulatedContent += padding + displayContent;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      steps: [...accumulatedSteps],
                    }
                  : m,
              ),
            );
          } else if (chunk.type === "token") {
            const text = chunk.content?.trim() || "";
            if (
              text !== "}" &&
              text !== "{" &&
              text !== "]" &&
              text !== "[" &&
              !text.startsWith("```") &&
              !text.startsWith('"type":') &&
              !text.startsWith('"id":') &&
              !text.includes('"ppt_raw"')
            ) {
              const stepIndex = accumulatedSteps.findIndex(
                (s) => s.phase === phase,
              );
              if (
                stepIndex >= 0 &&
                accumulatedSteps[stepIndex].content.endsWith(
                  chunk.content + "\n",
                )
              ) {
                // Skip duplicate
              } else {
                updateStep(phase, currentPhaseLabel, chunk.content);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === agentMsgId
                      ? { ...m, steps: [...accumulatedSteps] }
                      : m,
                  ),
                );
              }
            }
          } else if (chunk.type === "error") {
            accumulatedContent +=
              (accumulatedContent ? "\n\n" : "") +
              `鉂?${(chunk as ErrorChunk).content || "鐢熸垚澶辫触"}`;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      steps: [...accumulatedSteps],
                    }
                  : m,
              ),
            );
          } else if (chunk.type === "done" || chunk.type === "drawio_done") {
            setStreamPhase("done");
          }
        },
        (error: Error) => {
          console.error("Stream error:", error);
          if (
            error.name !== "AbortError" &&
            renderedSlideCount === 0 &&
            !accumulatedContent
          ) {
            accumulatedContent +=
              (accumulatedContent ? "\n\n" : "") +
              `鉂?杩炴帴寮傚父: ${error.message}`;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      steps: m.steps?.map((s) => ({ ...s, status: "done" })),
                    }
                  : m,
              ),
            );
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      steps: m.steps?.map((s) => ({ ...s, status: "done" })),
                    }
                  : m,
              ),
            );
          }
          setIsSending(false);
          setStreamPhase("");
          setStreamProgress("");
        },
        () => {
          setIsSending(false);
          setStreamPhase("");
          setStreamProgress("");
          accumulatedSteps.forEach((s) => {
            s.status = "done";
          });

          if (accumulatedText && renderedSlideCount === 0) {
            const detectedPpt = tryParsePpt(accumulatedText);
            if (detectedPpt) {
              const normalizedPpt = normalizePptData(detectedPpt);
              setPptData(normalizedPpt);
              setCurrentSlideIndex(0);
              renderedSlideCount = normalizedPpt.slides.length;
              setSessions((prev) =>
                prev.map((session) =>
                  session.id === currentSessionIdRef
                    ? {
                        ...session,
                        pptData: normalizedPpt,
                        lastModified: Date.now(),
                      }
                    : session,
                ),
              );
              accumulatedContent +=
                (accumulatedContent ? "\n\n" : "") +
                `PPT generated successfully: ${normalizedPpt.slides.length} slides. You can preview or download it now.`;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        content: accumulatedContent,
                        steps: [...accumulatedSteps],
                      }
                    : m,
                ),
              );
            } else {
              let displayContent = accumulatedText;
              if (accumulatedText.trim().startsWith("{")) {
                try {
                  const parsed = JSON.parse(stripMdCodeBlock(accumulatedText));
                  if (parsed.slides && Array.isArray(parsed.slides)) {
                    const norm = normalizePptData(parsed);
                    setPptData(norm);
                    setCurrentSlideIndex(0);
                    setSessions((prev) =>
                      prev.map((session) =>
                        session.id === currentSessionIdRef
                          ? {
                              ...session,
                              pptData: norm,
                              lastModified: Date.now(),
                            }
                          : session,
                      ),
                    );
                    accumulatedContent +=
                      (accumulatedContent ? "\n\n" : "") +
                      `PPT generated successfully: ${norm.slides.length} slides.`;
                  } else {
                    displayContent =
                      parsed.message ||
                      parsed.content ||
                      parsed.text ||
                      "Received response.";
                    if (typeof displayContent !== "string")
                      displayContent = JSON.stringify(displayContent);
                    accumulatedContent +=
                      (accumulatedContent ? "\n\n" : "") + displayContent;
                  }
                } catch {
                  accumulatedContent +=
                    (accumulatedContent ? "\n\n" : "") +
                    "Received a response, but could not parse PPT data.";
                }
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        content: accumulatedContent,
                        steps: [...accumulatedSteps],
                      }
                    : m,
                ),
              );
            }
          } else if (renderedSlideCount > 0) {
            const finalPpt = tryParsePpt(accumulatedText);
            if (finalPpt && finalPpt.slides.length >= renderedSlideCount) {
              const normalizedPpt = normalizePptData(finalPpt);
              setPptData(normalizedPpt);
              renderedSlideCount = normalizedPpt.slides.length;
              setSessions((prev) =>
                prev.map((session) =>
                  session.id === currentSessionIdRef
                    ? {
                        ...session,
                        pptData: normalizedPpt,
                        lastModified: Date.now(),
                      }
                    : session,
                ),
              );
            }
            accumulatedContent +=
              (accumulatedContent ? "\n\n" : "") +
              `PPT generated successfully: ${renderedSlideCount} slides. You can preview or download it now.`;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      steps: [...accumulatedSteps],
                    }
                  : m,
              ),
            );
            setCurrentSlideIndex(0);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? { ...m, steps: [...accumulatedSteps] }
                  : m,
              ),
            );
          }
        },
      );

      streamAbortRef.current = controller;
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content:
            error instanceof Error
              ? `错误：${error.message}`
              : "发送失败，请重试。",
          timestamp: Date.now(),
        },
      ]);
      setIsSending(false);
      setStreamPhase("");
      setStreamProgress("");
    }
  };
  const handleDownloadPptx = () => {
    if (!pptData) return;
    try {
      const activeTheme =
        THEMES.find((t) => t.id === selectedThemeId) || DEFAULT_THEME;
      const pres = generatePptx(pptData, activeTheme);
      pres.writeFile({ fileName: `${pptData.title || "鏈懡鍚嶆紨绀虹"}.pptx` });
    } catch (err) {
      console.error("Failed to generate PPTX:", err);
    }
  };

  const handleNewChat = async () => {
    if (!selectedAgentId || !currentUser) return;
    try {
      const res = await agentApi.createSession(selectedAgentId, currentUser);
      createNewSession(false, res.data.sessionId);
    } catch (error) {
      console.error("Failed to create new session:", error);
    }
  };

  const handleRestartSession = async () => {
    if (!selectedAgentId || !currentUser) return;
    try {
      const res = await agentApi.createSession(selectedAgentId, currentUser);
      const newBackendId = res.data.sessionId;
      const initialMsg: Message = {
        id: Date.now().toString(),
        role: "agent",
        content:
          "浣犲ソ锛佹垜鏄綘鐨勬紨绀虹鏅鸿兘鍔╂墜銆傝鍛婅瘔鎴戜綘鎯冲埗浣滀粈涔堜富棰樼殑婕旂ず绋匡紵",
        timestamp: Date.now(),
      };
      setSessionId(newBackendId);
      setMessages([initialMsg]);
      setPptData(null);
      setCurrentSlideIndex(0);

      if (currentSessionId) {
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id === currentSessionId) {
              return {
                ...session,
                backendSessionId: newBackendId,
                messages: [initialMsg],
                pptData: null,
                lastModified: Date.now(),
              };
            }
            return session;
          }),
        );
      }
    } catch (error) {
      console.error("Failed to restart session:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    {
      label: "Product Presentation",
      text: "请帮我制作一份产品季度汇报 PPT，包含业绩数据、重点项目进展和下季度规划，大约 8 页。",
    },
    {
      label: "技术方案演示",
      text: "请帮我制作一份微服务架构技术方案 PPT，包含架构设计、技术选型和部署方案，大约 6 页。",
    },
  ];

  // Helper: render layout-specific mini decorations for thumbnails
  const renderMiniDecor = (layout: string, slideIdx: number, t: PptTheme) => {
    const coverNavyPct = (t.coverNavyHeight / 7.5) * 100;
    const shadowMini = "0 1px 3px rgba(0,0,0,0.1)";

    if (layout === "title_classic" || layout === "end_slide") {
      return (
        <>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: `${coverNavyPct}%`,
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute inset-x-0"
            style={{
              top: `${coverNavyPct}%`,
              height: "2%",
              backgroundColor: `#${t.accent}`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              right: "6%",
              top: "8%",
              width: "16%",
              height: "16%",
              backgroundColor: `#${t.primaryLight}`,
              opacity: 0.3,
            }}
          />
        </>
      );
    } else if (layout === "title_center") {
      return (
        <>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: "4%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "4%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute inset-x-0"
            style={{ top: "4%", height: "1%", backgroundColor: `#${t.accent}` }}
          />
          <div
            className="absolute inset-x-0"
            style={{
              bottom: "4%",
              height: "1%",
              backgroundColor: `#${t.accent}`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: "38%",
              top: "26%",
              width: "24%",
              height: "24%",
              backgroundColor: `#${t.offWhite}`,
              opacity: 0.4,
              boxShadow: shadowMini,
            }}
          />
        </>
      );
    } else if (layout === "title_split") {
      return (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-1/2"
            style={{
              background: `linear-gradient(180deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2"
            style={{ backgroundColor: `#${t.offWhite}` }}
          />
          <div
            className="absolute"
            style={{
              left: "50%",
              top: 0,
              width: "1%",
              height: "100%",
              backgroundColor: `#${t.accent}`,
            }}
          />
        </>
      );
    } else if (layout === "card_3col") {
      return (
        <>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: "12%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          {[0, 34, 68].map((leftPct, i) => (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                left: `${leftPct}%`,
                top: "28%",
                width: "30%",
                height: "50%",
                backgroundColor: `#${t.offWhite}`,
                borderTop: `2px solid #${t.primary}`,
                boxShadow: shadowMini,
              }}
            />
          ))}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
        </>
      );
    } else if (layout === "comparison") {
      return (
        <>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: "12%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute rounded-sm"
            style={{
              left: "4%",
              top: "22%",
              width: "44%",
              height: "60%",
              backgroundColor: `#${t.offWhite}`,
              borderTop: `2px solid #${t.primary}`,
              boxShadow: shadowMini,
            }}
          />
          <div
            className="absolute rounded-sm"
            style={{
              left: "52%",
              top: "22%",
              width: "44%",
              height: "60%",
              backgroundColor: `#${t.offWhite}`,
              borderTop: `2px solid #${t.accent}`,
              boxShadow: shadowMini,
            }}
          />
          <div
            className="absolute"
            style={{
              left: "49.5%",
              top: "22%",
              width: "1%",
              height: "60%",
              backgroundColor: `#${t.primaryLight}`,
              opacity: 0.5,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
        </>
      );
    } else if (layout === "timeline") {
      return (
        <>
          <div
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: "4%",
              height: "100%",
              background: `linear-gradient(180deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute"
            style={{
              left: "10%",
              top: "46%",
              width: "85%",
              height: "2%",
              backgroundColor: `#${t.primaryLight}`,
              opacity: 0.5,
            }}
          />
          {["16%", "39%", "62%", "85%"].map((leftPct, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: leftPct,
                top: "40%",
                width: "12%",
                height: "12%",
                backgroundColor: `#${i < 3 ? t.primary : t.accent}`,
                boxShadow: shadowMini,
              }}
            />
          ))}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
        </>
      );
    } else if (layout === "data_highlight") {
      return (
        <>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: "10%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: "22%", backgroundColor: `#${t.offWhite}` }}
          />
          <div
            className="absolute"
            style={{
              left: "4%",
              top: "16%",
              width: "0.5%",
              height: "60%",
              backgroundColor: `#${t.primary}`,
              borderRadius: "4px",
            }}
          />
          <div
            className="absolute inset-x-0"
            style={{
              bottom: "5%",
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
        </>
      );
    } else if (layout === "quote_slide") {
      return (
        <>
          <div
            className="absolute inset-x-0"
            style={{ backgroundColor: `#${t.offWhite}`, inset: "0" }}
          />
          <div
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: "6%",
              height: "100%",
              background: `linear-gradient(180deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute"
            style={{
              left: "6%",
              top: "37%",
              width: "1%",
              height: "24%",
              backgroundColor: `#${t.accent}`,
              borderRadius: "4px",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
        </>
      );
    } else if (layout === "card_2col") {
      return (
        <>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: "12%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute rounded-sm"
            style={{
              left: "8%",
              top: "28%",
              width: "38%",
              height: "50%",
              backgroundColor: `#${t.offWhite}`,
              borderTop: `2px solid #${t.primary}`,
              boxShadow: shadowMini,
            }}
          />
          <div
            className="absolute rounded-sm"
            style={{
              left: "54%",
              top: "28%",
              width: "38%",
              height: "50%",
              backgroundColor: `#${t.offWhite}`,
              borderTop: `2px solid #${t.primary}`,
              boxShadow: shadowMini,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
        </>
      );
    } else if (layout === "content_top") {
      return (
        <>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: "16%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute inset-x-0"
            style={{
              top: "16%",
              height: "2%",
              backgroundColor: `#${t.accent}`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
        </>
      );
    } else {
      // Default content_classic
      return (
        <>
          <div
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: "34%",
              height: "95%",
              background: `linear-gradient(180deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
          <div
            className="absolute"
            style={{
              left: "34%",
              top: 0,
              width: "0.5%",
              height: "95%",
              backgroundColor: `#${t.accent}`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "5%",
              background: `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`,
            }}
          />
        </>
      );
    }
  };

  // Render mini slide for thumbnail panel (simplified, very small)
  const renderMiniSlide = (slideData: PptSlide, slideIdx: number) => {
    const layout = inferLayout(
      slideData,
      slideIdx,
      pptData?.slides.length ?? 1,
    );
    const t = activeTheme;

    return (
      <div
        className="w-full h-full relative bg-white"
        style={{ fontSize: "2px" }}
      >
        {/* Theme decorations (mini) 鈥?layout-specific */}
        {renderMiniDecor(layout, slideIdx, t)}
        {/* Actual text content in thumbnail */}
        {slideData.elements
          .filter((el) => el.kind === "text")
          .slice(0, 3)
          .map((el, i) => {
            const isTitle = (el.fontSize || 0) >= 24;
            // Use safe-area clamped position for color detection
            const safe = getSafeContentArea(layout, t);
            const elX = Math.max(
              safe.x,
              Math.min(el.x || 0, safe.x + safe.w - (el.w || 2)),
            );
            const elY = Math.max(
              safe.y,
              Math.min(el.y || 0, safe.y + safe.h - (el.h || 1)),
            );
            const elCenterX = elX + (el.w || 4) / 2;
            const elCenterY = elY + (el.h || 1) / 2;
            const onDark = isOnDarkArea(elCenterX, elCenterY, layout, t);
            const yPct = ((el.y || 0) / 7.5) * 100;
            const hPct = Math.max(8, ((el.h || 1) / 7.5) * 100);
            // Position-aware color for thumbnails
            let miniColor = onDark ? `#${t.white}` : `#${t.bodyColor}`;
            if (isTitle && !onDark) miniColor = `#${t.primary}`;
            return (
              <div
                key={i}
                className="absolute overflow-hidden"
                style={{
                  left: "6%",
                  right: "6%",
                  top: `${Math.min(yPct, 85)}%`,
                  height: `${hPct}%`,
                  color: miniColor,
                  fontSize: isTitle ? "3px" : "2px",
                  fontWeight: isTitle ? "bold" : "normal",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {(el.content || "").replace(/[鈥-]/g, "").trim().slice(0, 30)}
              </div>
            );
          })}
      </div>
    );
  };

  // Render slide content elements (shared between main preview and fullscreen)
  const renderSlideContent = (slideData: PptSlide, slideIdx: number) => {
    const layout = inferLayout(
      slideData,
      slideIdx,
      pptData?.slides.length ?? 1,
    );
    const isTitleSlide = layout === "title_slide" || slideIdx === 0;
    const isEndSlide =
      layout === "end_slide" || slideIdx === (pptData?.slides.length ?? 1) - 1;

    // Filter: remove ALL shape elements (decorative), only keep text, table, image
    const filteredElements = slideData.elements.filter((el) => {
      if (el.kind === "shape") return false; // Always skip shapes - theme handles decor
      return true;
    });

    return filteredElements.map((el, idx) => {
      // Clamp element positions to safe content area to prevent overlap with decorations
      const safe = getSafeContentArea(layout, activeTheme);
      const elX = Math.max(
        safe.x,
        Math.min(el.x || 0, safe.x + safe.w - (el.w || 2)),
      );
      const elY = Math.max(
        safe.y,
        Math.min(el.y || 0, safe.y + safe.h - (el.h || 1)),
      );

      const xPct = (elX / 13.33) * 100;
      const yPct = (elY / 7.5) * 100;
      const wPct = ((el.w || 4) / 13.33) * 100;
      const hPct = ((el.h || 1) / 7.5) * 100;

      if (el.kind === "text") {
        const fontSizeNum = el.fontSize || 18;
        let fontSize = Math.max(8, fontSizeNum * 0.7);
        // Position-aware color detection: check if element center is on a dark area
        const elCenterX = elX + (el.w || 4) / 2;
        const elCenterY = elY + (el.h || 1) / 2;
        const onDark = isOnDarkArea(elCenterX, elCenterY, layout, activeTheme);
        let textColor = onDark
          ? `#${activeTheme.white}`
          : `#${activeTheme.bodyColor}`;

        // Title text (fontSize >= 24) gets special treatment for emphasis
        if (fontSizeNum >= 24) {
          if (onDark) {
            textColor = `#${activeTheme.white}`;
          } else {
            // On light area: use primary color for titles
            textColor = `#${activeTheme.primary}`;
          }
        }
        // Large decorative text (big numbers etc): allow AI color choice
        if (el.color && fontSizeNum >= 30) {
          textColor = `#${el.color}`;
        }

        return (
          <div
            key={idx}
            className="absolute overflow-hidden"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
              fontSize: `${fontSize}px`,
              color: textColor,
              fontWeight: el.bold ? "bold" : "normal",
              backgroundColor: el.fill ? `#${el.fill}` : "transparent",
              textAlign: el.align || "left",
              display: "flex",
              alignItems:
                el.fontSize && el.fontSize >= 30
                  ? "center"
                  : el.icon
                    ? "center"
                    : "flex-start",
              lineHeight: fontSizeNum >= 30 ? 1.2 : 1.6,
              letterSpacing: fontSizeNum >= 30 ? "0.5px" : "0.2px",
              whiteSpace: "pre-wrap",
              paddingTop: fontSizeNum < 22 ? "2px" : "0",
              textShadow:
                fontSizeNum >= 30 && textColor === `#${activeTheme.white}`
                  ? "0 1px 3px rgba(0,0,0,0.2)"
                  : "none",
              gap: el.icon ? "4px" : "0",
            }}
          >
            {el.icon && (
              <span style={{ fontSize: `${fontSize * 1.1}px`, flexShrink: 0 }}>
                {el.icon}
              </span>
            )}
            <span
              dangerouslySetInnerHTML={{
                __html: (el.content || "").replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        );
      }

      if (el.kind === "shape" && el.w >= 0.6 && el.h >= 0.25) {
        return (
          <div
            key={idx}
            className="absolute"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
              backgroundColor: el.fill ? `#${el.fill}` : "#2E5090",
              borderRadius: el.radius ? `${el.radius}px` : "0",
              boxShadow: el.shadow ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              opacity: el.opacity ?? 1,
            }}
          />
        );
      }

      // Icon element: renders emoji/icon at a specific position
      if (el.kind === "icon") {
        const iconSize = Math.max(16, (el.fontSize || 32) * 0.7);
        return (
          <div
            key={idx}
            className="absolute flex items-center justify-center"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
              fontSize: `${iconSize}px`,
              color: el.color ? `#${el.color}` : `#${activeTheme.primary}`,
            }}
          >
            {el.icon || el.content || "•"}
          </div>
        );
      }

      // Divider line element
      if (el.kind === "divider") {
        const isHorizontal = (el.w || 0) > (el.h || 0);
        return (
          <div
            key={idx}
            className="absolute"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: isHorizontal
                ? `${wPct}%`
                : `${((el.thickness || 0.04) / 13.33) * 100}%`,
              height: isHorizontal
                ? `${((el.thickness || 0.04) / 7.5) * 100}%`
                : `${hPct}%`,
              backgroundColor: el.color
                ? `#${el.color}`
                : `#${activeTheme.accent}`,
              borderRadius: "2px",
              opacity: el.opacity ?? 0.8,
            }}
          />
        );
      }

      // Numbered bullet element: circle with number + text
      if (el.kind === "bullet") {
        const bulletSize = Math.max(20, (el.fontSize || 14) * 0.7);
        const numSize = Math.max(10, bulletSize * 0.55);
        return (
          <div
            key={idx}
            className="absolute"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
              display: "flex",
              alignItems: "flex-start",
              gap: "6px",
            }}
          >
            {/* Number circle */}
            <div
              style={{
                minWidth: `${bulletSize}px`,
                height: `${bulletSize}px`,
                borderRadius: "50%",
                backgroundColor: el.fill
                  ? `#${el.fill}`
                  : `#${activeTheme.primary}`,
                color: `#${activeTheme.white}`,
                fontSize: `${numSize}px`,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {el.number ?? 1}
            </div>
            {/* Text content */}
            <div
              style={{
                fontSize: `${bulletSize * 0.72}px`,
                color: el.color ? `#${el.color}` : `#${activeTheme.bodyColor}`,
                lineHeight: 1.5,
                fontWeight: el.bold ? "bold" : "normal",
              }}
              dangerouslySetInnerHTML={{
                __html: (el.content || "").replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        );
      }

      if (el.kind === "table" && Array.isArray(el.rows) && el.rows.length > 0) {
        const safeRows = el.rows.filter(
          (r: any) => Array.isArray(r) && r.length > 0,
        );
        if (safeRows.length === 0) return null;
        return (
          <div
            key={idx}
            className="absolute overflow-auto"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
            }}
          >
            <table
              className="w-full border-collapse"
              style={{ fontSize: "10px" }}
            >
              <tbody>
                {safeRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell: any, ci: number) => (
                      <td
                        key={ci}
                        className="border px-0.5 py-0.5 text-center"
                        style={{
                          borderColor: "#C0C8D4",
                          backgroundColor:
                            ri === 0
                              ? `#${activeTheme.primary}`
                              : ri % 2 === 0
                                ? `#${activeTheme.offWhite}`
                                : "transparent",
                          color:
                            ri === 0 ? "white" : `#${activeTheme.bodyColor}`,
                          fontWeight: ri === 0 ? "bold" : "normal",
                        }}
                      >
                        {cell ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      if (el.kind === "image") {
        return (
          <div
            key={idx}
            className="absolute bg-slate-100 overflow-hidden"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
              borderRadius: el.radius ? `${el.radius}px` : "4px",
              boxShadow: el.shadow
                ? "0 6px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
                : "none",
              opacity: el.opacity ?? 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {el.content ? (
              <img
                src={el.content}
                alt="幻灯片图片"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Icons.FilePresentation className="w-8 h-8 text-slate-300" />
            )}
          </div>
        );
      }

      return null;
    });
  };

  // Render current slide detail
  // Helper: render a positioned div for theme decoration in preview
  // Enhanced with gradient, shadow, rounded corners support
  const renderDecorDiv = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    key: string,
    opts?: {
      isCircle?: boolean;
      radius?: number; // border-radius in px
      shadow?: boolean;
      gradient?: string; // CSS gradient string, e.g. 'linear-gradient(135deg, #1F3864, #2E5090)'
      opacity?: number; // 0-1
    },
  ) => {
    const {
      isCircle = false,
      radius = 0,
      shadow = false,
      gradient,
      opacity = 1,
    } = opts || {};
    return (
      <div
        key={key}
        className="absolute"
        style={{
          left: `${(x / 13.33) * 100}%`,
          top: `${(y / 7.5) * 100}%`,
          width: `${(w / 13.33) * 100}%`,
          height: `${(h / 7.5) * 100}%`,
          background: gradient || `#${color}`,
          borderRadius: isCircle ? "50%" : radius ? `${radius}px` : "0",
          boxShadow: shadow
            ? "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)"
            : "none",
          opacity,
        }}
      />
    );
  };

  // Render theme decorations for preview 鈥?layout-specific skeletons (ENHANCED)
  const renderThemeDecor = (slideData: PptSlide, slideIdx: number) => {
    const layout = inferLayout(
      slideData,
      slideIdx,
      pptData?.slides.length ?? 1,
    );
    const t = activeTheme;
    const elements: React.ReactNode[] = [];

    const pctX = (v: number) => (v / 13.33) * 100;
    const pctY = (v: number) => (v / 7.5) * 100;
    const pctW = (v: number) => (v / 13.33) * 100;
    const pctH = (v: number) => (v / 7.5) * 100;

    // Common gradient helpers
    const primaryGrad = `linear-gradient(135deg, #${t.primary}, #${t.primaryMid})`;
    const primaryVertGrad = `linear-gradient(180deg, #${t.primary}, #${t.primaryMid})`;

    if (layout === "title_classic" || layout === "end_slide") {
      // Cover / End Classic 鈥?gradient cover + soft accent
      elements.push(
        renderDecorDiv(0, 0, 13.33, t.coverNavyHeight, t.primary, "t-top", {
          gradient: primaryGrad,
          radius: 0,
        }),
      );
      elements.push(
        renderDecorDiv(0, t.coverNavyHeight, 13.33, 0.12, t.accent, "t-stripe"),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
      // Decorative circle with transparency
      elements.push(
        renderDecorDiv(10.5, 0.6, 2.2, 2.2, t.primaryLight, "t-circle", {
          isCircle: true,
          opacity: 0.3,
        }),
      );
      // Secondary subtle circle
      elements.push(
        renderDecorDiv(0.3, 4.8, 1.4, 1.4, t.primaryLight, "t-circle2", {
          isCircle: true,
          opacity: 0.15,
        }),
      );
    } else if (layout === "title_center") {
      // Cover Center 鈥?gradient bars + soft center circle
      elements.push(
        renderDecorDiv(0, 0, 13.33, 0.25, t.primary, "t-top", {
          gradient: primaryGrad,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.25, 13.33, 0.25, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
      elements.push(
        renderDecorDiv(0, 0.25, 13.33, 0.05, t.accent, "t-top-accent"),
      );
      elements.push(
        renderDecorDiv(0, 7.2, 13.33, 0.05, t.accent, "t-bot-accent"),
      );
      elements.push(
        renderDecorDiv(5.16, 2.25, 3.0, 3.0, t.offWhite, "t-circle", {
          isCircle: true,
          opacity: 0.4,
          shadow: true,
        }),
      );
    } else if (layout === "title_split") {
      // Cover Split 鈥?gradient left + subtle divider
      elements.push(
        renderDecorDiv(0, 0, 6.66, 7.5, t.primary, "t-left", {
          gradient: primaryVertGrad,
        }),
      );
      elements.push(renderDecorDiv(6.66, 0, 6.67, 7.5, t.offWhite, "t-right"));
      elements.push(
        renderDecorDiv(6.66, 0, 0.1, 7.5, t.accent, "t-divider", {
          radius: 2,
        }),
      );
      // Decorative circle on left panel
      elements.push(
        renderDecorDiv(1.0, 5.0, 1.8, 1.8, t.primaryLight, "t-circle1", {
          isCircle: true,
          opacity: 0.2,
        }),
      );
    } else if (layout === "card_3col") {
      // 3-Column Cards 鈥?shadow cards with rounded top accent
      elements.push(
        renderDecorDiv(0, 0, 13.33, 0.9, t.primary, "t-header", {
          gradient: primaryGrad,
        }),
      );
      elements.push(renderDecorDiv(0, 0.9, 13.33, 0.06, t.accent, "t-accent"));
      elements.push(
        renderDecorDiv(0.5, 1.6, 3.8, 5.0, t.offWhite, "t-card1bg", {
          shadow: true,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(4.75, 1.6, 3.8, 5.0, t.offWhite, "t-card2bg", {
          shadow: true,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(9.0, 1.6, 3.8, 5.0, t.offWhite, "t-card3bg", {
          shadow: true,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(0.5, 1.6, 3.8, 0.12, t.primary, "t-card1top", {
          gradient: primaryGrad,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(4.75, 1.6, 3.8, 0.12, t.primary, "t-card2top", {
          gradient: primaryGrad,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(9.0, 1.6, 3.8, 0.12, t.primary, "t-card3top", {
          gradient: primaryGrad,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
    } else if (layout === "comparison") {
      // Comparison: shadow cards with accent divider
      elements.push(
        renderDecorDiv(0, 0, 13.33, 0.9, t.primary, "t-header", {
          gradient: primaryGrad,
        }),
      );
      elements.push(renderDecorDiv(0, 0.9, 13.33, 0.06, t.accent, "t-accent"));
      elements.push(
        renderDecorDiv(0.5, 1.5, 5.9, 5.2, t.offWhite, "t-leftblock", {
          shadow: true,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(0.5, 1.5, 5.9, 0.1, t.primary, "t-lefttop", {
          gradient: primaryGrad,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(6.9, 1.5, 5.9, 5.2, t.offWhite, "t-rightblock", {
          shadow: true,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(6.9, 1.5, 5.9, 0.1, t.accent, "t-righttop", {
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(6.55, 1.5, 0.2, 5.2, t.primaryLight, "t-divider", {
          radius: 2,
          opacity: 0.5,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
    } else if (layout === "timeline") {
      // Timeline: gradient left bar + soft dots
      elements.push(
        renderDecorDiv(0, 0, 0.5, 7.5, t.primary, "t-leftbar", {
          gradient: primaryVertGrad,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
      elements.push(
        renderDecorDiv(1.2, 3.5, 11.5, 0.12, t.primaryLight, "t-line", {
          opacity: 0.5,
        }),
      );
      elements.push(
        renderDecorDiv(2.5, 3.2, 0.7, 0.7, t.primary, "t-dot1", {
          isCircle: true,
          shadow: true,
        }),
      );
      elements.push(
        renderDecorDiv(5.5, 3.2, 0.7, 0.7, t.primary, "t-dot2", {
          isCircle: true,
          shadow: true,
        }),
      );
      elements.push(
        renderDecorDiv(8.5, 3.2, 0.7, 0.7, t.primary, "t-dot3", {
          isCircle: true,
          shadow: true,
        }),
      );
      elements.push(
        renderDecorDiv(11.5, 3.2, 0.7, 0.7, t.accent, "t-dot4", {
          isCircle: true,
          shadow: true,
        }),
      );
    } else if (layout === "data_highlight") {
      // Data Highlight: gradient header + soft bottom band
      elements.push(
        renderDecorDiv(0, 0, 13.33, 0.7, t.primary, "t-header", {
          gradient: primaryGrad,
        }),
      );
      elements.push(renderDecorDiv(0, 0.7, 13.33, 0.06, t.accent, "t-accent"));
      elements.push(
        renderDecorDiv(0, 6.0, 13.33, 1.5, t.offWhite, "t-bottomband", {
          radius: 0,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
      elements.push(
        renderDecorDiv(0.5, 1.2, 0.08, 4.5, t.primary, "t-leftbar", {
          radius: 4,
        }),
      );
    } else if (layout === "quote_slide") {
      // Quote: gradient left bar + soft bg
      elements.push(renderDecorDiv(0, 0, 13.33, 7.5, t.offWhite, "t-bg"));
      elements.push(
        renderDecorDiv(0, 0, 0.8, 7.5, t.primary, "t-leftbar", {
          gradient: primaryVertGrad,
          radius: 0,
        }),
      );
      elements.push(
        renderDecorDiv(0.8, 2.8, 0.12, 1.8, t.accent, "t-accent", {
          radius: 4,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
    } else if (layout === "card_2col") {
      // 2-Column Cards 鈥?shadow + rounded
      elements.push(
        renderDecorDiv(0, 0, 13.33, 0.9, t.primary, "t-header", {
          gradient: primaryGrad,
        }),
      );
      elements.push(renderDecorDiv(0, 0.9, 13.33, 0.06, t.accent, "t-accent"));
      elements.push(
        renderDecorDiv(1.0, 1.6, 5.0, 5.0, t.offWhite, "t-card1bg", {
          shadow: true,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(7.33, 1.6, 5.0, 5.0, t.offWhite, "t-card2bg", {
          shadow: true,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(1.0, 1.6, 5.0, 0.15, t.primary, "t-card1top", {
          gradient: primaryGrad,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(7.33, 1.6, 5.0, 0.15, t.primary, "t-card2top", {
          gradient: primaryGrad,
          radius: 8,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
    } else if (layout === "content_top") {
      // Content Top Bar 鈥?gradient header
      elements.push(
        renderDecorDiv(0, 0, 13.33, 1.2, t.primary, "t-header", {
          gradient: primaryGrad,
        }),
      );
      elements.push(
        renderDecorDiv(0, 1.2, 13.33, 0.08, t.accent, "t-accent", {
          radius: 0,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
    } else {
      // Default content_classic: gradient left band + accent divider
      elements.push(
        renderDecorDiv(0, 0, 4.5, 7.15, t.primary, "t-leftband", {
          gradient: primaryVertGrad,
        }),
      );
      elements.push(
        renderDecorDiv(4.5, 0, 0.08, 7.15, t.accent, "t-divider", {
          radius: 4,
        }),
      );
      elements.push(
        renderDecorDiv(0, 7.15, 13.33, 0.35, t.primary, "t-bottom", {
          gradient: primaryGrad,
        }),
      );
    }
    return elements;
  };

  return (
    <div className="workspace-dark-shell flex h-screen w-full flex-col overflow-hidden font-sans">
      <WorkspaceHeader activePath="/ppt" />
      {/* ===== Header Bar ===== */}
      <header className="tool-header workspace-dark-header flex h-16 items-center justify-between border-b px-4 md:px-6 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cyan-400 via-indigo-500 to-emerald-500 p-1.5 rounded-xl shadow-[0_10px_24px_rgba(79,70,229,0.22)]">
            <Icons.FilePresentation className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">
              AI Bok 鍒涗綔绀惧尯Sutmuch
            </h1>
            <p className="text-[11px] text-slate-400">Sutmuch 婕旂ず绋垮伐浣滃彴</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="workspace-secondary-btn flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            杩斿洖宸ヤ綔鍙?
          </button>

          <a
            href="https://sukesutone.cn/md/project/ai-agent-scaffold/ai-agent-scaffold.html"
            target="_blank"
            rel="noopener noreferrer"
            className="workspace-secondary-btn flex items-center gap-1.5 px-3 py-2 text-xs font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            绀惧尯鎸囧崡
          </a>

          <div className="h-6 w-px bg-slate-700 mx-1"></div>

          <div className="workspace-subpanel flex items-center gap-2 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span className="text-xs font-semibold text-slate-300">
              {currentUser || "璁垮"}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1"></div>

          <button
            onClick={handleDownloadPptx}
            disabled={!pptData}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 ${
              pptData
                ? "text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                : "text-slate-500 cursor-not-allowed opacity-50"
            }`}
          >
            <Icons.Download className="w-4 h-4" />
            涓嬭浇婕旂ず绋?
          </button>

          {pptData && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
              </svg>
              鍏ㄥ睆婕旂ず
            </button>
          )}

          <button
            onClick={() => setIsStylePanelOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 border ${
              isStylePanelOpen
                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
            }`}
            title="椋庢牸璁剧疆"
          >
            馃帥锔?
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="退出登录"
          >
            <Icons.Logout className="w-4 h-4" />
          </button>

          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
              title="鎵撳紑鍔╂墜"
            >
              <Icons.Chat className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ===== Main 3-Column Layout ===== */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* ===== Left: Slide Thumbnails / Template Library ===== */}
        <aside className="w-[180px] bg-white border-r border-slate-100/60 flex flex-col shrink-0 z-30">
          {/* Tab Switcher: Templates / Slides */}
          <div className="px-2 pt-2 pb-1 border-b border-slate-100 flex gap-1">
            <button
              onClick={() => setLeftTab("templates")}
              className={`flex-1 text-[10px] font-medium py-1 rounded transition ${leftTab === "templates" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
            >
              馃搵 妯℃澘
            </button>
            <button
              onClick={() => setLeftTab("slides")}
              className={`flex-1 text-[10px] font-medium py-1 rounded transition ${leftTab === "slides" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
            >
              馃柤锔?椤甸潰
            </button>
          </div>

          {/* Theme Selector (always visible) */}
          <div className="px-3 pt-2 pb-2 border-b border-slate-100">
            <div className="text-[10px] text-slate-400 font-medium mb-1.5">
              馃帹 涓婚
            </div>
            <div className="flex flex-wrap gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThemeId(t.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                    selectedThemeId === t.id
                      ? "border-indigo-500 scale-110 shadow-md"
                      : "border-slate-200 hover:border-slate-400 hover:scale-105"
                  }`}
                  title={t.name}
                >
                  <div
                    className="w-4 h-4 rounded-full overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, #${t.primary} 50%, #${t.accent} 50%)`,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
            {leftTab === "templates" ? (
              /* Template Library */
              <div className="space-y-0.5">
                {PPT_TEMPLATES.map((cat) => (
                  <div key={cat.category}>
                    <button
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === cat.category
                            ? null
                            : cat.category,
                        )
                      }
                      className="w-full flex items-center gap-1.5 px-1.5 py-1.5 rounded-md hover:bg-slate-50 transition text-left"
                    >
                      <span className="text-xs">{cat.icon}</span>
                      <span className="text-[11px] font-medium text-slate-600 flex-1">
                        {cat.label}
                      </span>
                      <span className="text-[9px] text-slate-300">
                        {cat.templates.length}
                      </span>
                      <svg
                        className={`w-3 h-3 text-slate-400 transition-transform ${expandedCategory === cat.category ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    {expandedCategory === cat.category && (
                      <div className="ml-3 space-y-0.5 mb-1">
                        {cat.templates.map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => {
                              setInputValue(tpl.prompt);
                              if (tpl.style) setSelectedStyle(tpl.style);
                              if (tpl.scene) setSelectedScene(tpl.scene);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition group"
                          >
                            <div className="text-[11px] font-medium text-slate-700 group-hover:text-indigo-700">
                              {tpl.name}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                              {tpl.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : pptData && pptData.slides.length > 0 ? (
              pptData.slides.map((slide, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`cursor-pointer rounded-md transition-all ${
                    currentSlideIndex === idx
                      ? "ring-2 ring-indigo-500 ring-offset-2 shadow-md"
                      : "ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="text-[10px] text-slate-400 mb-1 pl-0.5 font-medium">
                    {idx + 1}
                  </div>
                  <div className="w-full aspect-[16/9] bg-white rounded overflow-hidden relative shadow-sm">
                    {renderMiniSlide(slide, idx)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Icons.FilePresentation className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                <p className="text-[11px] text-slate-400">暂无幻灯片</p>
                <p className="text-[9px] text-slate-300 mt-1">
                  鍦ㄥ彸渚ц緭鍏ラ渶姹傛垨閫夋嫨妯℃澘
                </p>
              </div>
            )}
          </div>

          {/* Session list */}
          <div className="border-t border-slate-100">
            <div className="h-9 px-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                鍘嗗彶
              </span>
              <button
                onClick={handleNewChat}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                title="鏂板缓"
              >
                <Icons.Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-[120px] overflow-y-auto px-2 pb-2 space-y-0.5">
              {[...sessions]
                .sort((a, b) => b.lastModified - a.lastModified)
                .slice(0, 8)
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSwitchSession(session.id)}
                    className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition ${
                      currentSessionId === session.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className="text-[11px] truncate flex-1">
                      {session.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-slate-300 hover:text-red-500 transition"
                    >
                      <Icons.Trash className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        {/* ===== Center: Main Slide Preview ===== */}
        <main className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
          <div
            className="flex-1 flex items-center justify-center p-6 overflow-hidden"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
              } else if (
                e.key === "ArrowRight" ||
                e.key === "ArrowDown" ||
                e.key === " "
              ) {
                e.preventDefault();
                if (pptData)
                  setCurrentSlideIndex(
                    Math.min(pptData.slides.length - 1, currentSlideIndex + 1),
                  );
              } else if (e.key === "Escape") {
                setIsFullscreen(false);
              }
            }}
          >
            {!pptData || !pptData.slides[currentSlideIndex] ? (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Icons.FilePresentation className="w-12 h-12 text-slate-300" />
                </div>
                <p className="text-base text-slate-500 mb-2 font-medium">
                  鐢熸垚瀹屾垚鍚庡皢鍦ㄨ繖閲岄瑙堟紨绀虹
                </p>
                <p className="text-sm text-slate-400">
                  鍦ㄥ彸渚у璇濆尯鎻忚堪浣犵殑闇€姹?
                </p>
              </div>
            ) : (
              <div
                className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden relative"
                style={{
                  width: "100%",
                  maxWidth: "960px",
                  aspectRatio: "16/9",
                  maxHeight: "calc(100vh - 160px)",
                }}
              >
                <div
                  className="w-full h-full relative"
                  style={{
                    fontFamily:
                      '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
                    letterSpacing: "0.2px",
                  }}
                >
                  {renderThemeDecor(
                    pptData.slides[currentSlideIndex],
                    currentSlideIndex,
                  )}
                  {renderSlideContent(
                    pptData.slides[currentSlideIndex],
                    currentSlideIndex,
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Slide navigation bar */}
          {pptData && pptData.slides.length > 0 && (
            <div className="h-11 px-4 bg-white border-t border-slate-200 flex items-center justify-center gap-4 shrink-0">
              <button
                onClick={() =>
                  setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
                }
                disabled={currentSlideIndex === 0}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className="text-sm text-slate-500 font-mono tabular-nums min-w-[60px] text-center">
                {currentSlideIndex + 1} / {pptData.slides.length}
              </span>
              <button
                onClick={() =>
                  setCurrentSlideIndex(
                    Math.min(pptData.slides.length - 1, currentSlideIndex + 1),
                  )
                }
                disabled={currentSlideIndex === pptData.slides.length - 1}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              <span className="text-xs text-slate-400">鈫?鈫?缈婚〉</span>
            </div>
          )}
        </main>

        {/* ===== Right: Style Panel + Chat Panel ===== */}
        <div className="flex shrink-0 z-20">
          {/* Style Control Panel */}
          <div
            className={`border-l border-slate-100/60 bg-white flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
              isStylePanelOpen
                ? "w-[220px] translate-x-0"
                : "w-0 translate-x-full opacity-0 overflow-hidden"
            }`}
          >
            <div className="h-12 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-slate-800">
                馃帥锔?椋庢牸璁剧疆
              </span>
              <button
                onClick={() => setIsStylePanelOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition shrink-0"
              >
                <Icons.Close className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
              {/* Style */}
              <div>
                <div className="text-xs text-slate-400 font-medium mb-2">
                  椋庢牸
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedStyle(opt.id)}
                      className={`px-2 py-1.5 rounded-md text-xs transition ${
                        selectedStyle === opt.id
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                          : "bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Structure */}
              <div>
                <div className="text-xs text-slate-400 font-medium mb-2">
                  缁撴瀯
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STRUCTURE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedStructure(opt.id)}
                      className={`px-2 py-1.5 rounded-md text-xs transition ${
                        selectedStructure === opt.id
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                          : "bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Tone */}
              <div>
                <div className="text-xs text-slate-400 font-medium mb-2">
                  鑹茶皟
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedTone(opt.id)}
                      className={`px-2 py-1.5 rounded-md text-xs transition ${
                        selectedTone === opt.id
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                          : "bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Scene */}
              <div>
                <div className="text-xs text-slate-400 font-medium mb-2">
                  鍦烘櫙
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SCENE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedScene(opt.id)}
                      className={`px-2 py-1.5 rounded-md text-xs transition ${
                        selectedScene === opt.id
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                          : "bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Layout Preference */}
              <div>
                <div className="text-xs text-slate-400 font-medium mb-2">
                  甯冨眬鍋忓ソ
                </div>
                <div className="space-y-1">
                  {LAYOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (opt.id === "auto") {
                          setSelectedLayouts(["auto"]);
                        } else {
                          setSelectedLayouts((prev) => {
                            const without = prev.filter((x) => x !== "auto");
                            return without.includes(opt.id)
                              ? without.filter((x) => x !== opt.id)
                              : [...without, opt.id];
                          });
                        }
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition flex items-center justify-between ${
                        selectedLayouts.includes(opt.id)
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                          : "bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100"
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-slate-400">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Sidebar - Modern & Elegant */}
          <div
            className={`
            border-l border-slate-100/60 bg-white flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
            ${isChatOpen ? "w-[380px] translate-x-0" : "w-0 translate-x-full opacity-0 overflow-hidden"}
            shadow-xl z-20
          `}
          >
            {/* Chat Header */}
            <div className="workspace-dark-header sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 md:px-5 shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200 shrink-0 ring-2 ring-white">
                  <Icons.Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <select
                    value={selectedAgentId}
                    onChange={handleAgentChange}
                    className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer truncate appearance-none pr-4"
                    style={{ backgroundImage: "none" }}
                  >
                    {agents.length === 0 && (
                      <option value="">姝ｅ湪鍔犺浇鏅鸿兘浣?..</option>
                    )}
                    {agents.map((agent) => (
                      <option key={agent.agentId} value={agent.agentId}>
                        {agent.agentName}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight">
                      鏅鸿兘鍔╂墜鍦ㄧ嚎
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all shrink-0"
                >
                  <Icons.Close className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {messages.map((msg, index) => {
                return (
                  <div
                    key={`${msg.id}-${index}`}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`
                    shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1 ring-2 ring-white
                    ${
                      msg.role === "user"
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-white text-indigo-500 border border-slate-100"
                    }
                  `}
                    >
                      {msg.role === "user" ? (
                        <Icons.User className="w-5 h-5" />
                      ) : (
                        <Icons.Bot className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex flex-col max-w-[85%] w-full">
                      <span
                        className={`text-[10px] mb-1.5 font-medium ${msg.role === "user" ? "text-right text-slate-400" : "text-left text-slate-400"}`}
                      >
                        {msg.role === "user" ? "我" : "Sutmuch"}
                      </span>

                      <div
                        className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
                      >
                        {/* Steps / Reasoning Block */}
                        {msg.role === "agent" &&
                          ((msg.steps && msg.steps.length > 0) ||
                            msg.reasoning) && (
                            <div className="w-full max-w-full">
                              <details
                                className="w-full group/details open:pb-2"
                                open={
                                  index === messages.length - 1 && isSending
                                }
                              >
                                <summary className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-slate-700 font-medium select-none bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all hover:border-slate-300">
                                  <Icons.Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="group-open/details:hidden">
                                    灞曞紑鎵ц姝ラ
                                  </span>
                                  <span className="hidden group-open/details:inline">
                                    鏀惰捣鎵ц姝ラ
                                  </span>
                                </summary>
                                <div className="mt-2 flex flex-col gap-2 p-3 bg-slate-50/50 border border-slate-200 rounded-xl shadow-sm text-sm text-slate-600 max-w-none overflow-x-auto">
                                  {msg.steps && msg.steps.length > 0 ? (
                                    msg.steps.map((step, idx) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col gap-1.5 p-2 bg-white rounded-lg border border-slate-100 shadow-sm"
                                      >
                                        <div className="flex items-center gap-2 font-medium text-slate-700">
                                          {step.status === "running" ? (
                                            <Icons.Loader className="w-3.5 h-3.5 text-indigo-500" />
                                          ) : (
                                            <span className="text-green-500">
                                              鉁?
                                            </span>
                                          )}
                                          <span>{step.label}</span>
                                        </div>
                                        {step.content && (
                                          <div className="text-xs text-slate-500 pl-6 border-l-2 border-slate-100 ml-1.5 prose prose-sm prose-slate max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-slate-100 prose-pre:text-slate-700">
                                            <ReactMarkdown
                                              remarkPlugins={[remarkGfm]}
                                            >
                                              {step.content}
                                            </ReactMarkdown>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm prose prose-sm prose-slate max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-slate-100 prose-pre:text-slate-700">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                      >
                                        {msg.reasoning || ""}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                              </details>
                            </div>
                          )}

                        {/* Content Block */}
                        {msg.content && (
                          <div
                            className={`
                                p-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap w-fit
                                ${
                                  msg.role === "user"
                                    ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-200"
                                    : "bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm prose prose-sm prose-slate max-w-none overflow-x-auto prose-p:my-1 prose-pre:my-2 prose-pre:bg-slate-100 prose-pre:text-slate-700"
                                }
                            `}
                          >
                            {msg.role === "user" ? (
                              msg.content
                            ) : (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            )}
                          </div>
                        )}

                        {/* Empty state while generating */}
                        {msg.role === "agent" &&
                          !msg.content &&
                          !msg.reasoning &&
                          isSending && (
                            <div className="flex gap-1 items-center px-4 py-3 text-sm shadow-sm bg-white border border-indigo-100 text-indigo-600 rounded-2xl rounded-tl-sm">
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></span>
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></span>
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Stream Progress Indicator */}
              {isSending && streamPhase !== "done" && (
                <div className="flex gap-3 flex-row animate-in fade-in duration-300">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1 ring-2 ring-white bg-white text-indigo-500 border border-slate-100 opacity-50">
                    <Icons.Bot className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col max-w-[85%]">
                    <div className="px-4 py-3 text-sm shadow-sm bg-white border border-indigo-100 text-indigo-600 rounded-2xl rounded-tl-sm flex items-center gap-3">
                      <div className="flex gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0 relative z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              {/* Quick Actions - Only show when chat is empty (just greeting) */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-3 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputValue(action.text);
                        setTimeout(() => {
                          const textarea = document.querySelector("textarea");
                          if (textarea) {
                            textarea.style.height = "auto";
                            textarea.style.height =
                              Math.min(textarea.scrollHeight, 240) + "px";
                          }
                        }, 10);
                      }}
                      className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100 font-medium shadow-sm text-left"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:bg-white transition-all shadow-sm">
                <textarea
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 300) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isSending
                      ? "鏅鸿兘鍔╂墜姝ｅ湪鐢熸垚涓?.."
                      : "杈撳叆鎮ㄧ殑闂锛屾弿杩版偍鐨勯渶姹?.."
                  }
                  disabled={isSending}
                  className="flex-1 px-4 py-3 bg-transparent border-none focus:ring-0 text-[15px] text-slate-800 placeholder:text-slate-400 resize-none max-h-[300px] min-h-[80px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent disabled:opacity-50 disabled:cursor-not-allowed outline-none leading-relaxed"
                  rows={1}
                  style={{ height: "auto", minHeight: "80px" }}
                />
                <div className="flex gap-1 mb-0.5 shrink-0">
                  {isSending ? (
                    <button
                      onClick={handleStopStream}
                      className="p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 shadow-sm"
                      title="鍋滄鐢熸垚"
                    >
                      <Icons.Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className={`
                        p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center
                        ${
                          inputValue.trim()
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }
                      `}
                      title="发送消息"
                    >
                      <Icons.Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleRestartSession}
                    disabled={isSending}
                    className="p-2.5 rounded-lg bg-white text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all duration-200 border border-slate-200 hover:border-indigo-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="閲嶅惎瀵硅瘽"
                  >
                    <Icons.Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Model Selection - below textarea */}
              <div className="flex items-center gap-2 mt-2 px-1">
                <div className="relative flex items-center bg-white border border-slate-200 rounded-full shadow-sm hover:border-slate-300 transition-colors">
                  <Icons.Sparkles
                    className={`w-3 h-3 ml-2 ${selectedCustomModelId !== "default" ? "text-indigo-500" : "text-slate-400"}`}
                  />
                  <select
                    value={selectedCustomModelId}
                    onChange={(e) => {
                      if (e.target.value === "add_new") {
                        setShowApiConfig(true);
                        e.target.value = selectedCustomModelId;
                      } else {
                        setSelectedCustomModelId(e.target.value);
                        localStorage.setItem(
                          "ai_agent_selected_model",
                          e.target.value,
                        );
                      }
                    }}
                    className="appearance-none bg-transparent border-none text-[11px] font-medium text-slate-600 focus:ring-0 py-1 pl-1 pr-5 cursor-pointer outline-none"
                  >
                    <option value="default">榛樿妯″瀷</option>
                    {customModels
                      .filter((m) => m.enabled)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.model}
                        </option>
                      ))}
                    <option disabled>鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€</option>
                    <option value="add_new">+ 绠＄悊妯″瀷</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                    <svg
                      className="fill-current h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 ml-auto hidden sm:inline">
                  <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500">
                    鍥炶溅
                  </kbd>{" "}
                  鍙戦€?
                </span>
              </div>
              <div className="text-center mt-1.5">
                <p className="text-[10px] text-slate-400">
                  {isSending ? streamProgress || "鐢熸垚涓?.." : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showApiConfig && (
        <div className="workspace-modal-scrim">
          <div className="workspace-modal-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Icons.Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
                <h2 className="text-base font-bold text-slate-800">
                  鑷畾涔夋ā鍨嬮厤缃?
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowApiConfig(false);
                  setEditingModel(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Icons.Close className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* List of Models */}
              <div className="w-1/3 border-r border-slate-100 bg-slate-50 flex flex-col">
                <div className="p-3">
                  <button
                    onClick={handleAddNewModel}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Icons.Plus className="w-4 h-4" /> 娣诲姞妯″瀷
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {customModels.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => setEditingModel(model)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${editingModel?.id === model.id ? "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-100" : "bg-white border-slate-200 hover:border-indigo-100 hover:shadow-sm"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm text-slate-800 truncate pr-2">
                          {model.name}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle Switch */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newModels = customModels.map((m) =>
                                m.id === model.id
                                  ? { ...m, enabled: !m.enabled }
                                  : m,
                              );
                              saveCustomModels(newModels);
                              if (
                                !!model.enabled &&
                                selectedCustomModelId === model.id
                              ) {
                                setSelectedCustomModelId("default");
                              }
                            }}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${model.enabled ? "bg-indigo-500" : "bg-slate-300"}`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${model.enabled ? "translate-x-3.5" : "translate-x-0.5"}`}
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModel(model.id);
                            }}
                            className="text-slate-400 hover:text-red-500 ml-1"
                          >
                            <Icons.Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {model.model}
                      </div>
                    </div>
                  ))}
                  {customModels.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-6">
                      鏆傛棤鑷畾涔夋ā鍨?
                      <br />
                      鐐瑰嚮涓婃柟鎸夐挳娣诲姞
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <div className="flex-1 p-6 overflow-y-auto bg-white">
                {editingModel ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        灞曠ず鍚嶇О
                      </label>
                      <input
                        type="text"
                        value={editingModel.name}
                        onChange={(e) =>
                          setEditingModel({
                            ...editingModel,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="渚嬪锛氭垜鐨凣PT-4o"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        妯″瀷鍚嶇О
                      </label>
                      <input
                        type="text"
                        value={editingModel.model}
                        onChange={(e) =>
                          setEditingModel({
                            ...editingModel,
                            model: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="渚嬪锛歡pt-4o"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        鎺ュ彛鍦板潃
                      </label>
                      <input
                        type="text"
                        value={editingModel.baseUrl}
                        onChange={(e) =>
                          setEditingModel({
                            ...editingModel,
                            baseUrl: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="渚嬪锛歨ttps://api.openai.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        鎺ュ彛瀵嗛挜
                      </label>
                      <input
                        type="password"
                        value={editingModel.apiKey}
                        onChange={(e) =>
                          setEditingModel({
                            ...editingModel,
                            apiKey: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="sk-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        瀵硅瘽鎺ュ彛璺緞锛堝彲閫夛級
                      </label>
                      <input
                        type="text"
                        value={editingModel.completionsPath}
                        onChange={(e) =>
                          setEditingModel({
                            ...editingModel,
                            completionsPath: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="榛樿涓?v1/chat/completions"
                      />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveEditingModel}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all text-sm"
                      >
                        淇濆瓨閰嶇疆
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Icons.Sparkles className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">
                      閫夋嫨宸︿晶妯″瀷鍚庡彲缂栬緫锛屼篃鍙互鏂板缓妯″瀷
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ===== Fullscreen Presentation ===== */}
      {isFullscreen && pptData && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "q") setIsFullscreen(false);
            else if (
              e.key === "ArrowRight" ||
              e.key === "ArrowDown" ||
              e.key === " "
            ) {
              e.preventDefault();
              setCurrentSlideIndex(
                Math.min(pptData.slides.length - 1, currentSlideIndex + 1),
              );
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
            }
          }}
          tabIndex={0}
          autoFocus
        >
          <div
            className="bg-white overflow-hidden relative"
            style={{
              width: "100vw",
              height: "calc(100vw * 9 / 16)",
              maxHeight: "100vh",
              maxWidth: "calc(100vh * 16 / 9)",
            }}
          >
            <div
              className="w-full h-full relative"
              style={{
                fontFamily:
                  '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
                letterSpacing: "0.2px",
              }}
            >
              {renderThemeDecor(
                pptData.slides[currentSlideIndex],
                currentSlideIndex,
              )}
              {renderSlideContent(
                pptData.slides[currentSlideIndex],
                currentSlideIndex,
              )}
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-xs pointer-events-none">
            ESC 閫€鍑?路 鈫?鈫?缈婚〉
          </div>
          <div className="absolute bottom-4 right-6 text-white/20 text-xs font-mono pointer-events-none">
            {currentSlideIndex + 1} / {pptData.slides.length}
          </div>
        </div>
      )}
    </div>
  );
}








