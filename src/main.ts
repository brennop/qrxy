import "./style.css";
import { draw, regl } from "./art";
import * as zbarWasm from "https://cdn.jsdelivr.net/npm/@undecaf/zbar-wasm@0.9.16/dist/main.js";

const barcode: {
  value: string | null;
  cornerPoints: any;
} = {
  cornerPoints: null,
  value: null,
};

let offscreenCanvas: OffscreenCanvas | null = null;

if (!window.OffscreenCanvas) {
  window.OffscreenCanvas = class OffscreenCanvas {
    constructor(width, height) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = width;
      this.canvas.height = height;

      this.canvas.convertToBlob = () => {
        return new Promise((resolve) => {
          this.canvas.toBlob(resolve);
        });
      };

      return this.canvas;
    }
  };
}

const video = document.querySelector("video")!;
const canvas = document.querySelector("canvas")!;

const animate = () => {
  // requestAnimationFrame(animate);

  const scale = Math.min(
    window.innerWidth / video.videoWidth,
    window.innerHeight / video.videoHeight,
  );

  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;

  const ctx = offscreenCanvas?.getContext("2d");

  if (!ctx) {
    requestAnimationFrame(animate);
    return;
  }

  ctx.drawImage(video, 0, 0);

  const imageData = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight);

  zbarWasm.scanImageData(imageData).then(([detected]) => {
    if (detected) {
      // convert screen coordinates to normalized coordinates
      // https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detector/cornerPoints
      barcode.cornerPoints = detected.points.map(
        ({ x, y }: { x: number; y: number }) => [
          (x / video.videoWidth) * 2 - 1,
          (y / video.videoHeight) * -2 + 1,
        ],
      );

      barcode.value = detected.decode();
    }

    requestAnimationFrame(animate);
  });
};

regl.frame(() => {
  if (barcode.cornerPoints === null) {
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
  });
});

// get back camera
navigator.mediaDevices
  .getUserMedia({
    video: {
      facingMode: "environment",
    },
  })
  .then((stream) => {
    video.srcObject = stream;
    video.play();

    setTimeout(() => {
      offscreenCanvas = new OffscreenCanvas(
        video.videoWidth,
        video.videoHeight,
      );
    }, 1000);

    animate();
  });
