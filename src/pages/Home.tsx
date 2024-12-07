import React, { useEffect, useRef } from "react";

const App: React.FC = () => {
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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // MediaPipe hands connection array
    const HAND_CONNECTIONS = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4], // Thumb
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8], // Index finger
      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12], // Middle finger
      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16], // Ring finger
      [13, 17],
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20], // Pinky finger
    ];

    // Draw hand landmarks and connections
    results.multiHandLandmarks?.forEach((landmarks: any) => {
      // Draw connections
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

      // Draw landmarks
      landmarks.forEach((landmark: any) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      });
    });
  };

  return (
    <div>
      <h1>MediaPipe Hands with Connections</h1>
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          style={{ display: "none" }}
          playsInline
          muted
        ></video>
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0 }}
        ></canvas>
      </div>
    </div>
  );
};

export default App;
