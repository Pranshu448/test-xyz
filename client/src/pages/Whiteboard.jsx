import { useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import CanvasBoard from "../components/CanvasBoard";

export default function Whiteboard() {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const canvasRef = useRef(null);

  // 🔹 join room + listen for draw batches
  useEffect(() => {
    if (!socket) return;

    socket.emit("join_whiteboard", roomId);

    socket.on("draw_event", ({ points }) => {
      drawFromSocket(points);
    });

    return () => {
      socket.off("draw_event");
    };
  }, [socket, roomId]);

  // 🔹 draw batch received from socket
  const drawFromSocket = (points) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.beginPath();

    points.forEach((p, index) => {
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });

    ctx.stroke();
  };

  // 🔹 send batch to server
  const handleDraw = (points) => {
    if (!socket || points.length === 0) return;

    socket.emit("draw_event", {
      roomId,
      points,
    });
  };

  return (
    <CanvasBoard
      onDraw={handleDraw}
      canvasRef={canvasRef}
    />
  );
}
