import React, { useState, useEffect, useRef } from "react";

const Home: React.FC = () => {
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);
  const ratio = 640 / 480;
  const buttonRef = useRef<HTMLDivElement>(null);
  const hoverStartTime = useRef<number | null>(null);

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

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const HAND_CONNECTIONS = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      [13, 17],
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20],
    ];

    results.multiHandLandmarks?.forEach((landmarks: any) => {
      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startX = landmarks[start].x * canvas.width;
        const startY = landmarks[start].y * canvas.height;
        const endX = landmarks[end].x * canvas.width;
        const endY = landmarks[end].y * canvas.height;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      landmarks.forEach((landmark: any, idx: number) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        if (idx == 8) {
          ctx.fillStyle = "pink";
        } else {
          ctx.fillStyle = "red";
        }
        ctx.fill();
      });
    });
  };

  const checkHover = (results: any) => {
    if (!buttonRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const buttonElement = buttonRef.current;

    // Get button position and size relative to the canvas
    const buttonLeft =
      parseFloat(buttonElement.style.left || "0") * (canvas.width / width);
    const buttonTop =
      parseFloat(buttonElement.style.top || "0") * (canvas.height / height);
    const buttonWidth =
      parseFloat(buttonElement.style.width || "0") * (canvas.width / width);
    const buttonHeight =
      parseFloat(buttonElement.style.height || "0") * (canvas.height / height);

    results.multiHandLandmarks?.forEach((landmarks: any) => {
      const indexFingerTip = landmarks[8]; // Index finger tip landmark
      const x = indexFingerTip.x * canvas.width;
      const y = indexFingerTip.y * canvas.height;

      const isHovering =
        x >= buttonLeft &&
        x <= buttonLeft + buttonWidth &&
        y >= buttonTop &&
        y <= buttonTop + buttonHeight;

      console.log(
        x >= buttonLeft,
        x <= buttonLeft + buttonWidth,
        y >= buttonTop,
        y <= buttonTop + buttonHeight
      );

      if (isHovering) {
        if (!hoverStartTime.current) {
          hoverStartTime.current = performance.now();
        } else if (performance.now() - hoverStartTime.current >= 5000) {
          alert("Hello");
          hoverStartTime.current = null; // Reset after activation
        }
      } else {
        hoverStartTime.current = null; // Reset if not hovering
      }
    });
  };

  return (
    <div className="w-full mx-auto flex justify-center items-center">
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
              top: "30%",
              left: "30%",
              width: "100px",
              height: "50px",
              backgroundColor: "green",
              textAlign: "center",
              lineHeight: "50px",
              color: "white",
              fontWeight: "bold",
              borderRadius: "8px",
              pointerEvents: "none", // Prevent interaction
            }}
          >
            Button
          </div>
        </div>
        <video
          ref={videoRef}
          style={{ width: width, height: height }}
          playsInline
          muted
        ></video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{
            width: width,
            height: height,
          }}
        ></canvas>
      </div>
    </div>
  );
};

export default Home;
