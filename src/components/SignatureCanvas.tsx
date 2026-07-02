"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export type SignatureCanvasHandle = {
  getDataUrl: () => string | null;
  isEmpty: () => boolean;
  clear: () => void;
};

const SignatureCanvas = forwardRef<SignatureCanvasHandle>(
  function SignatureCanvas(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const [hasStrokes, setHasStrokes] = useState(false);

    function getPos(clientX: number, clientY: number) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function getCtx() {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return null;
      ctx.strokeStyle = "#13261f";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      return ctx;
    }

    function onStart(e: React.MouseEvent | React.TouchEvent) {
      e.preventDefault();
      isDrawingRef.current = true;
      const ctx = getCtx();
      if (!ctx) return;
      const { clientX, clientY } = "touches" in e ? e.touches[0] : e;
      const pos = getPos(clientX, clientY);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function onMove(e: React.MouseEvent | React.TouchEvent) {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const ctx = getCtx();
      if (!ctx) return;
      const { clientX, clientY } = "touches" in e ? e.touches[0] : e;
      const pos = getPos(clientX, clientY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      if (!hasStrokes) setHasStrokes(true);
    }

    function onEnd() {
      isDrawingRef.current = false;
    }

    useImperativeHandle(ref, () => ({
      getDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? null,
      isEmpty: () => !hasStrokes,
      clear: () => {
        const c = canvasRef.current;
        if (!c) return;
        c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
        setHasStrokes(false);
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className={`w-full touch-none rounded-2xl border-2 bg-[#fafffe] ${
          hasStrokes ? "border-[#1ba77d]" : "border-[#d8e7e0]"
        }`}
        style={{ cursor: "crosshair" }}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      />
    );
  },
);

export default SignatureCanvas;
