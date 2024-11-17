// Type definitions for predictions and landmarks
interface Landmark {
  0: number; // x-coordinate
  1: number; // y-coordinate
  2: number; // z-coordinate (optional for 2D)
}

interface Prediction {
  landmarks: Landmark[]; // Array of landmarks
}

// Points for fingers
const fingerJoints: Record<string, number[]> = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

// Infinity Gauntlet Style
const style: Record<number, { color: string; size: number }> = {
  0: { color: "red", size: 5 },
  1: { color: "red", size: 5 },
  2: { color: "red", size: 5 },
  3: { color: "red", size: 5 },
  4: { color: "red", size: 5 },
  5: { color: "red", size: 5 },
  6: { color: "red", size: 5 },
  7: { color: "red", size: 5 },
  8: { color: "red", size: 5 },
  9: { color: "red", size: 5 },
  10: { color: "red", size: 5 },
  11: { color: "red", size: 5 },
  12: { color: "red", size: 5 },
  13: { color: "red", size: 5 },
  14: { color: "red", size: 5 },
  15: { color: "red", size: 5 },
  16: { color: "red", size: 5 },
  17: { color: "red", size: 5 },
  18: { color: "red", size: 5 },
  19: { color: "red", size: 5 },
  20: { color: "red", size: 5 },
};

// Drawing function
export const drawHand = (
  predictions: Prediction[],
  ctx: CanvasRenderingContext2D
): void => {
  // Check if we have predictions
  if (predictions.length > 0) {
    // Loop through each prediction
    predictions.forEach((prediction) => {
      // Grab landmarks
      const { landmarks } = prediction;

      // Loop through fingers
      for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
        const finger = Object.keys(fingerJoints)[j];
        // Loop through pairs of joints
        for (let k = 0; k < fingerJoints[finger].length - 1; k++) {
          // Get pairs of joints
          const firstJointIndex = fingerJoints[finger][k];
          const secondJointIndex = fingerJoints[finger][k + 1];

          // Draw path
          ctx.beginPath();
          ctx.moveTo(
            landmarks[firstJointIndex][0],
            landmarks[firstJointIndex][1]
          );
          ctx.lineTo(
            landmarks[secondJointIndex][0],
            landmarks[secondJointIndex][1]
          );
          ctx.strokeStyle = "plum";
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      }

      // Loop through landmarks and draw them
      for (let i = 0; i < landmarks.length; i++) {
        // Get x and y points
        const x = landmarks[i][0];
        const y = landmarks[i][1];

        // Start drawing
        ctx.beginPath();
        ctx.arc(x, y, style[i]?.size || 5, 0, 2 * Math.PI);

        // Set line color
        ctx.fillStyle = style[i]?.color || "black";
        ctx.fill();
      }
    });
  }
};
