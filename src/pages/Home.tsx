import { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-wasm";
import "@tensorflow/tfjs-backend-cpu";

import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import { drawHand } from "./utilities";

interface Keypoint3D {
  x: number;
  y: number;
  z: number;
}

type HandposeModel = Awaited<ReturnType<typeof handpose.load>>;

function Home(): JSX.Element {
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

  const webcamRef = useRef<Webcam | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setBackend = async () => {
    const backends = ["webgl", "wasm", "cpu"]; // Fallback order
    for (const backend of backends) {
      if (tf.engine().registry[backend]) {
        await tf.setBackend(backend);
        const backendName = tf.getBackend();
        console.log(`Backend set to: ${backendName}`);
        return;
      }
    }
    console.error("No supported backend found.");
  };

  useEffect(() => {
    setBackend();
    runHandpose();
  }, []);

  const runHandpose = async () => {
    const net: HandposeModel = await handpose.load();
    console.log("Handpose model loaded.");
    setInterval(() => {
      detect(net);
    }, 1);
  };

  const detect = async (net: HandposeModel) => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      video.width = videoWidth;
      video.height = videoHeight;

      if (canvasRef.current) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      const hand = await net.estimateHands(video);
      console.log(hand);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          drawHand(hand, ctx);
        }
      }
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          style={{
            width: width,
            height: height,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            top: 0,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: width,
            height: height,
          }}
        />
      </div>
    </div>
  );
}

export default Home;
