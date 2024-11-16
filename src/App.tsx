import React, { useRef, useEffect } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import * as drawingUtils from "@mediapipe/drawing_utils";

const HandTracking: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let handsInstance: Hands | null = null;

  const stopExistingStream = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const setupCamera = async () => {
    stopExistingStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((error) => {
            console.error("Error playing video:", error);
          });
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access your camera. Please allow camera permissions.");
    }
  };

  const initializeHandTracking = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const { Hands } = await import("@mediapipe/hands");

    handsInstance = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsInstance.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    handsInstance.onResults((results) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      results.multiHandLandmarks?.forEach((landmarks: drawingUtils.NormalizedLandmarkList | undefined) => {
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

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await handsInstance?.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  };

  useEffect(() => {
    setupCamera();
    initializeHandTracking();

    return () => {
      stopExistingStream();
      handsInstance?.close();
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
