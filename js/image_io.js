export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    img.src = url;
  });
}

export function setImgSrc(imgEl, url) {
  if (!imgEl) return;
  const prev = imgEl.dataset.url;
  if (prev) URL.revokeObjectURL(prev);
  imgEl.src = url;
  imgEl.dataset.url = url;
}

export function setDownloadFromBlob(linkEl, blob, filename) {
  if (!linkEl) return;
  const prev = linkEl.dataset.url;
  if (prev) URL.revokeObjectURL(prev);
  const url = URL.createObjectURL(blob);
  linkEl.href = url;
  linkEl.download = filename;
  linkEl.dataset.url = url;
}
