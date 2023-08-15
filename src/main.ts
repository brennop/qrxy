import "./style.css";
import { draw, regl } from "./art";

import {
  BarcodeDetectorPolyfill
} from "@undecaf/barcode-detector-polyfill";

const barcode: {
  value: string | null;
  cornerPoints: any;
} = {
  cornerPoints: null,
  value: null,
};

try {
  window["BarcodeDetector"].getSupportedFormats();
} catch {
  window["BarcodeDetector"] = BarcodeDetectorPolyfill;
}

const detector = new BarcodeDetectorPolyfill({
  formats: ["qr_code"],
});

const video = document.querySelector("video")!;
const canvas = document.querySelector("canvas")!;

const animate = () => {
  requestAnimationFrame(animate);

  const scale = Math.min(
    window.innerWidth / video.videoWidth,
    window.innerHeight / video.videoHeight
  );

  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;

  detector.detect(video).then(([detected]) => {
    if (detected) {
      // convert screen coordinates to normalized coordinates
      // https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detector/cornerPoints
      barcode.cornerPoints = detected.cornerPoints.map(
        ({ x, y }: { x: number; y: number }) => [
          (x / video.videoWidth) * 2 - 1,
          (y / video.videoHeight) * -2 + 1,
        ]
      );

      barcode.value = detected.rawValue;
    }
  });

};

regl.frame(() => {
  if (barcode.cornerPoints === null ) {
    return;
  }
  draw({
    positions: [
      barcode.cornerPoints[0],
      barcode.cornerPoints[1],
      barcode.cornerPoints[2],
      barcode.cornerPoints[0],
      barcode.cornerPoints[2],
      barcode.cornerPoints[3],
    ],
  })
});

// get back camera
navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: "environment",
  },
}).then((stream) => {
  video.srcObject = stream;
  video.play();
  animate();
});
