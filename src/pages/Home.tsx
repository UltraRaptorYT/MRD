import { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-wasm";
import "@tensorflow/tfjs-backend-cpu";

import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import { drawHand } from "./utilities";
import * as fp from "fingerpose";
import victory from "./victory.png";
import thumbs_up from "./thumbs_up.png";

interface Keypoint3D {
  x: number;
  y: number;
  z: number;
}

type HandposeModel = Awaited<ReturnType<typeof handpose.load>>;

function App(): JSX.Element {
  const webcamRef = useRef<Webcam | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [emoji, setEmoji] = useState<string | null>(null);
  const images: Record<string, string> = { thumbs_up, victory };

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
    }, 10);
  };

  const transformLandmarks = (
    landmarks: handpose.AnnotatedPrediction["landmarks"]
  ): Keypoint3D[] => {
    return landmarks.map(([x, y, z]) => ({ x, y, z }));
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

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture,
        ]);

        const transformedLandmarks = transformLandmarks(hand[0].landmarks);

        const gesture = await GE.estimate(transformedLandmarks, 4);
        if (gesture.gestures && gesture.gestures.length > 0) {
          const scores = gesture.gestures.map((g) => g.score);
          const maxScoreIndex = scores.indexOf(Math.max(...scores));
          setEmoji(gesture.gestures[maxScoreIndex].name);
        }
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          drawHand(hand, ctx);
        }
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />

        {emoji && (
          <img
            src={images[emoji]}
            alt="gesture"
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 400,
              bottom: 500,
              right: 0,
              textAlign: "center",
              height: 100,
              zIndex: 50,
            }}
          />
        )}
      </header>
    </div>
  );
}

export default App;
