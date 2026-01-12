import { clamp } from "./utils.js";

export function convertToCanvas(img, bg, tolerance, strength) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const [br, bgc, bb] = bg;
  const tol = clamp(tolerance, 0, 255);
  const tol2 = tol * tol;
  const strengthClamped = clamp(strength, 0, 2);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const d2 = (r - br) ** 2 + (g - bgc) ** 2 + (b - bb) ** 2;

    if (d2 <= tol2) {
      data[i] = Math.min(255, Math.round(r * strengthClamped));
      data[i + 1] = Math.min(255, Math.round(g * strengthClamped));
      data[i + 2] = Math.min(255, Math.round(b * strengthClamped));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
