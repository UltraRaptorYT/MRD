import React, { useState, useEffect, useRef } from "react";
import { HAND_CONNECTIONS } from "@/lib/utils";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const Room: React.FC = () => {
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);
  const ratio = 640 / 480;
  const buttonRef = useRef<HTMLDivElement>(null);
  const hoverStartTime = useRef<number | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const maxHoverTime = 2500; // Time in ms for full progress

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      if (windowWidth / windowHeight > ratio) {
        setHeight(windowHeight);
        setWidth(windowHeight * ratio);
      } else {
        setWidth(windowWidth);
        setHeight(windowWidth / ratio);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [ratio]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const { Hands } = window as any;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: any) => {
      drawHands(results);
      checkHover(results);
    });

    const video = videoRef.current;
    if (video) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            const processVideo = async () => {
              if (
                hands &&
                video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA
              ) {
                await hands.send({ image: video });
              }
              requestAnimationFrame(processVideo);
            };
            processVideo();
          };
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
        });
    }
  }, []);

  const drawHands = (results: any) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.scale(-1, 1); // Mirror horizontally
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    results.multiHandLandmarks?.forEach((landmarks: any) => {
      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startX = canvas.width - landmarks[start].x * canvas.width;
        const startY = landmarks[start].y * canvas.height;
        const endX = canvas.width - landmarks[end].x * canvas.width;
        const endY = landmarks[end].y * canvas.height;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      landmarks.forEach((landmark: any) => {
        const x = canvas.width - landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      });
    });
  };

  useEffect(() => {
    if (progress >= 100) {
      alert("DONE");
    }
  }, [progress]);

  const checkHover = (results: any) => {
    if (!buttonRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const buttonElement = buttonRef.current;

    const buttonRect = buttonElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const circleCenterX =
      (buttonRect.left - canvasRect.left + buttonRect.width / 2) *
      (canvas.width / canvasRect.width);
    const circleCenterY =
      (buttonRect.top - canvasRect.top + buttonRect.height / 2) *
      (canvas.height / canvasRect.height);
    const circleRadius =
      (buttonRect.width / 2) * (canvas.width / canvasRect.width);

    let isHovering = false;

    results.multiHandLandmarks?.forEach((landmarks: any) => {
      landmarks.forEach((landmark: any) => {
        const x = canvas.width - landmark.x * canvas.width; // Mirrored
        const y = landmark.y * canvas.height;

        const distance = Math.sqrt(
          (x - circleCenterX) ** 2 + (y - circleCenterY) ** 2
        );

        if (distance <= circleRadius) {
          isHovering = true;
        }
      });
    });

    if (isHovering) {
      if (!hoverStartTime.current) {
        hoverStartTime.current = performance.now();
        progressTimer.current = setInterval(() => {
          const elapsed = performance.now() - hoverStartTime.current!;
          const newProgress = Math.min((elapsed / maxHoverTime) * 100, 100); // Scale progress as a percentage

          setProgress(newProgress);

          if (newProgress >= 100) {
            clearInterval(progressTimer.current!);
            hoverStartTime.current = null;
            progressTimer.current = null;
          }
        }, 50); // Update progress every 50ms
      }
    } else {
      // Reset progress and hover time when not hovering
      clearInterval(progressTimer.current!);
      progressTimer.current = null;
      hoverStartTime.current = null;
      setProgress(0);
    }
  };

  return (
    <div className="w-full mx-auto flex justify-center items-center h-full">
      <div className="relative">
        <div
          className="absolute top-0 left-0 z-10"
          style={{
            width: width,
            height: height,
          }}
        >
          <div
            ref={buttonRef}
            style={{
              position: "absolute",
              top: "70%",
              left: "20%",
              width: "100px",
              height: "100px",
            }}
          >
            <CircularProgressbar value={progress} />
          </div>
        </div>
        <video
          ref={videoRef}
          style={{ width: width, height: height }}
          className="-scale-x-100"
          playsInline
          muted
        ></video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 "
          style={{
            width: width,
            height: height,
          }}
        ></canvas>
      </div>
    </div>
  );
};

export default Room;
