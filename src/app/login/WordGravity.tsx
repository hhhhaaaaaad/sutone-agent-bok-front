"use client";

import { useEffect, useRef } from "react";
import {
  Bodies,
  Body,
  Composite,
  Constraint,
  Engine,
  Query,
  Sleeping,
  Vector,
} from "matter-js";

const DEFAULT_WORDS = ["Story", "Draft", "Ideas", "Narrative", "Voice", "Prompt", "Rewrite", "Editor", "Research"];
const FONT = "400 30px Arial, sans-serif";

type WordBody = { body: Body; text: string };

type WordGravityProps = {
  words?: string[];
};

export default function WordGravity({ words: items = DEFAULT_WORDS }: WordGravityProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 0;
    let width = 0;
    let height = 0;
    let words: WordBody[] = [];
    let active = false;
    let frame = 0;
    let lastTime = performance.now();
    let dragConstraint: ReturnType<typeof Constraint.create> | null = null;
    let wordColor = "rgba(65, 68, 73, 0.64)";
    let activeWordColor = "#4f6858";

    const syncThemeColors = () => {
      const styles = getComputedStyle(document.documentElement);
      wordColor = styles.getPropertyValue("--gravity-word").trim() || wordColor;
      activeWordColor =
        styles.getPropertyValue("--gravity-word-active").trim() || activeWordColor;
    };

    const pointerPosition = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const reset = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.font = FONT;
      Composite.clear(engine.world, false, true);
      dragConstraint = null;

      const bounds = [
        Bodies.rectangle(width / 2, height + 14, width + 80, 28, { isStatic: true }),
        Bodies.rectangle(-14, height / 2, 28, height + 80, { isStatic: true }),
        Bodies.rectangle(width + 14, height / 2, 28, height + 80, { isStatic: true }),
      ];

      const measurements = items.map((text) => ({
        text,
        width: context.measureText(text).width + 10,
        height: 40,
      }));
      const rows: typeof measurements[] = [[]];
      let row = 0;
      let rowWidth = 0;
      const gap = 12;
      measurements.forEach((word) => {
        if (rowWidth + word.width > width - 28 && rows[row].length) {
          row += 1;
          rows[row] = [];
          rowWidth = 0;
        }
        rows[row].push(word);
        rowWidth += word.width + gap;
      });

      words = [];
      const totalHeight = rows.length * 48;
      rows.forEach((line, rowIndex) => {
        const lineWidth = line.reduce((sum, word) => sum + word.width, 0) + (line.length - 1) * gap;
        let x = (width - lineWidth) / 2;
        line.forEach((word) => {
          const body = Bodies.rectangle(
            x + word.width / 2,
            Math.max(18, (height - totalHeight) / 2) + rowIndex * 48 + word.height / 2,
            word.width,
            word.height,
            {
              density: 0.001,
              friction: 0.72,
              frictionStatic: 1,
              frictionAir: 0.018,
              restitution: 0.16,
              angle: 0,
              sleepThreshold: 50,
            },
          );
          words.push({ body, text: word.text });
          x += word.width + gap;
        });
      });
      Composite.add(engine.world, [...bounds, ...words.map(({ body }) => body)]);
      engine.gravity.y = active ? 1 : 0;
    };

    const onPointerEnter = () => {
      active = true;
      engine.gravity.y = 1;
      words.forEach(({ body }) => Sleeping.set(body, false));
    };

    const onPointerDown = (event: PointerEvent) => {
      const point = pointerPosition(event);
      const body = Query.point(words.map((word) => word.body), point).at(-1);
      if (!body) return;
      onPointerEnter();
      Sleeping.set(body, false);
      const localPoint = Vector.rotate(Vector.sub(point, body.position), -body.angle);
      dragConstraint = Constraint.create({
        pointA: point,
        bodyB: body,
        pointB: localPoint,
        stiffness: 0.18,
        damping: 0.12,
        length: 0,
      });
      Composite.add(engine.world, dragConstraint);
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = pointerPosition(event);
      if (dragConstraint) {
        dragConstraint.pointA = point;
        return;
      }
      canvas.style.cursor = Query.point(words.map((word) => word.body), point).length ? "grab" : "default";
    };

    const onPointerUp = (event: PointerEvent) => {
      if (dragConstraint) Composite.remove(engine.world, dragConstraint);
      dragConstraint = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.style.cursor = "default";
    };

    const draw = (now: number) => {
      const delta = Math.min(now - lastTime, 32);
      lastTime = now;
      Engine.update(engine, delta);
      context.clearRect(0, 0, width, height);
      context.font = FONT;
      context.textAlign = "center";
      context.textBaseline = "middle";

      words.forEach(({ body, text }) => {
        context.save();
        context.translate(body.position.x, body.position.y);
        context.rotate(body.angle);
        context.fillStyle = dragConstraint?.bodyB === body ? activeWordColor : wordColor;
        context.fillText(text, 0, 1);
        context.restore();
      });
      frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(reset);
    const themeObserver = new MutationObserver(syncThemeColors);
    observer.observe(canvas);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    syncThemeColors();
    reset();
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      themeObserver.disconnect();
      Composite.clear(engine.world, false, true);
      Engine.clear(engine);
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [items]);

  return (
    <div className="relative -mx-2 overflow-hidden border-y border-[#ded8cf]/70">
      <canvas
        ref={canvasRef}
        className="h-[210px] w-full touch-none select-none"
        aria-label="可拖拽的 AI 写作关键词"
      />
    </div>
  );
}
