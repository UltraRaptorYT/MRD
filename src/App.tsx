import React, { useRef, useEffect } from "react";
import { Hands, HAND_CONNECTIONS, Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import * as drawingUtils from "@mediapipe/drawing_utils";

const HandTracking: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the video frame on the canvas
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      // Draw hand landmarks and connections
      results.multiHandLandmarks?.forEach((landmarks) => {
        drawingUtils.drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
        drawingUtils.drawLandmarks(ctx, landmarks, {
          color: "#FF0000",
          lineWidth: 1,
        });
      });
    });

    // Set up the camera
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      hands.close();
      camera.stop();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

export default HandTracking;
