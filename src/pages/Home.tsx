import React, { useEffect, useRef, useState } from "react";
// import heartImg from "@/assets/heart.png";
import heartImg from "@/assets/BWM.png";

interface Point {
  x: number;
  y: number;
  color: string;
}

const ImageToPoints: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [visiblePoints, setVisiblePoints] = useState<Point[]>([]);
  const skipPoints = 20;

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setWidth(windowWidth);
      setHeight(windowHeight);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleImageLoad = (image: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Calculate aspect ratio to fit the image in the canvas (object-contain behavior)
    const imageAspectRatio = image.width / image.height;
    const canvasAspectRatio = width / height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imageAspectRatio > canvasAspectRatio) {
      // Image is wider than canvas
      drawWidth = width;
      drawHeight = width / imageAspectRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2; // Center vertically
    } else {
      // Image is taller than canvas
      drawHeight = height;
      drawWidth = height * imageAspectRatio;
      offsetX = (width - drawWidth) / 2; // Center horizontally
      offsetY = 0;
    }

    // Clear canvas and draw the image with padding (if needed)
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    const extractedPoints: Point[] = [];
    // Loop through the pixels (skipping some to sample)
    for (let y = 0; y < height; y += skipPoints) {
      for (let x = 0; x < width; x += skipPoints) {
        const index = (y * width + x) * 4; // RGBA index
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];

        // Add points based on a condition (e.g., non-transparent pixels)
        if (alpha > 128) {
          extractedPoints.push({ x, y, color: `rgb(${r},${g},${b})` });
        }
      }
    }

    // Shuffle the points randomly
    for (let i = extractedPoints.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [extractedPoints[i], extractedPoints[j]] = [
        extractedPoints[j],
        extractedPoints[i],
      ];
    }

    setPoints(extractedPoints);
  };

  useEffect(() => {
    if (points) {
      console.log(points, "hi");
      showPointsRandomly(points);
    }
  }, [points]);

  const showPointsRandomly = (points: Point[]) => {
    let index = 0;

    console.log(points.length, points[points.length - 1]);
    const interval = setInterval(() => {
      if (index >= points.length - 1 || !points[index]) {
        clearInterval(interval);
        return;
      }
      let currentPoint = { ...points[index] };
      console.log(index, points[index], currentPoint);
      setVisiblePoints((prev) => [...prev, { ...currentPoint }]);
      index++;
    }, 50); // Delay in milliseconds between points
  };

  useEffect(() => {
    const img = new Image();
    img.src = heartImg;
    img.onload = () => handleImageLoad(img);
  }, [width, height]);

  return (
    <div className="w-full h-full overflow-hidden">
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      <div className="relative" style={{ width: width, height: height }}>
        {visiblePoints.map((point, index) => {
          return (
            <img
              key={index}
              className="absolute w-20 point-animation"
              style={{
                top: point.y,
                left: point.x,
              }}
              src="https://sgyouthai.org/events/Cedar%20Girls%20Secondary%20School/photo_2024-04-22_17-46-24.jpg"
            />
          );
        })}
      </div>
    </div>
  );
};

export default ImageToPoints;
