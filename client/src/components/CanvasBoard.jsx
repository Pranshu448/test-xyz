import { useRef, useEffect, useState } from "react";

export default function CanvasBoard({ onDraw, canvasRef }) {
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const pointsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    //  FINER PEN SETTINGS
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2d3436"; // Use a slightly softer dark color
    ctx.lineWidth = 5; // Thinner for "finer" feel
    
    //  SOFTENS THE EDGES (Anti-aliasing boost)
    ctx.shadowBlur = 1; 
    ctx.shadowColor = "#2d3436";

    ctxRef.current = ctx;
  }, [canvasRef]);

  const startDraw = (e) => {
    setDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    pointsRef.current = [point];
  };

  const draw = (e) => {
    if (!drawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    pointsRef.current.push(point);

    //  USE REQUEST ANIMATION FRAME FOR SMOOTHNESS
    requestAnimationFrame(() => {
        drawSmoothStroke(pointsRef.current, ctxRef.current);
    });
  };

  const drawSmoothStroke = (points, ctx) => {
    if (points.length < 3) return;

    const lastThree = points.slice(-3);
    const p0 = lastThree[0];
    const p1 = lastThree[1];
    const p2 = lastThree[2];

    const xc1 = (p0.x + p1.x) / 2;
    const yc1 = (p0.y + p1.y) / 2;
    const xc2 = (p1.x + p2.x) / 2;
    const yc2 = (p1.y + p2.y) / 2;

    ctx.beginPath();
    ctx.moveTo(xc1, yc1);
    ctx.quadraticCurveTo(p1.x, p1.y, xc2, yc2);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    if (pointsRef.current.length > 1) {
      onDraw(pointsRef.current);
    }
    pointsRef.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      style={{
        width: "100%", // Use 100% of container instead of VW/VH for stability
        height: "100%",
        touchAction: "none", // Critical for tablet/mobile smoothness
        cursor: "crosshair",
      }}
    />
  );
}