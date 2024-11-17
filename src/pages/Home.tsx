import React, { useRef, useEffect, useState } from "react";
import * as pipe_hands from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import * as drawingUtils from "@mediapipe/drawing_utils";

const HandTracking: React.FC = () => {
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);
  const ratio = 640 / 480;

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      if (windowWidth / windowHeight > ratio) {
        // Window is wider than the aspect ratio, so fit height
        setHeight(windowHeight);
        setWidth(windowHeight * ratio);
      } else {
        // Window is taller than the aspect ratio, so fit width
        setWidth(windowWidth);
        setHeight(windowWidth / ratio);
      }
    };

    // Set initial size
    handleResize();

    // Attach the resize event listener
    window.addEventListener("resize", handleResize);

    // Cleanup the event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, [ratio]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<pipe_hands.Hands | null>(null);

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

    if (handsRef.current) {
      handsRef.current.close();
    }
    const hands = new pipe_hands.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${pipe_hands.VERSION}/${file}`,
    });

    hands.setOptions({
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      maxNumHands: 6,
    });

    handsRef.current = hands;
    hands.onResults((results) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      results.multiHandLandmarks?.forEach(
        (landmarks: drawingUtils.NormalizedLandmarkList | undefined) => {
          drawingUtils.drawConnectors(
            ctx,
            landmarks,
            pipe_hands.HAND_CONNECTIONS,
            {
              color: "#00FF00",
              lineWidth: 2,
            }
          );
          drawingUtils.drawLandmarks(ctx, landmarks, {
            color: "#FF0000",
            lineWidth: 1,
          });
        }
      );
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands?.send({ image: videoRef.current! });
      },
      width: width,
      height: height,
    });

    camera.start();
  };

  useEffect(() => {
    setupCamera();
    initializeHandTracking();

    return () => {
      stopExistingStream();
      handsRef.current?.close();
    };
  }, []);

  return (
    <div className="flex justify-center items-center w-full">
      <div className="relative w-fit h-auto">
        <video ref={videoRef} width={width} height={height} />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0"
        />
      </div>
    </div>
  );
};

export default HandTracking;
