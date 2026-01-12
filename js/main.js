import { CFG } from "./config.js";
import { dom } from "./dom.js";
import { appState } from "./state.js";
import { wireModals } from "./ui_modal.js";
import { wireOptionsUI } from "./ui_options.js";
import { showFatal, showError } from "./ui_errors.js";
import { validateFileOrThrow } from "./validators.js";
import { loadImageFromFile, setImgSrc, setDownloadFromBlob } from "./image_io.js";
import { convertToCanvas } from "./converter.js";
import { loadICCProfileBytes, buildICCPChunkData } from "./icc_loader.js";
import { insertICCPIntoPngBlob } from "./png_chunk.js";

async function bootstrap() {
  wireModals();
  wireOptionsUI(appState, () => {
    if (appState.lastFile) {
      handleFile(appState.lastFile);
    }
  });

  dom.bugLink.href = CFG.BUG_REPORT_URL;

  // 1) ICCファイル必須チェック(起動時)
  try {
    const iccBytes = await loadICCProfileBytes(CFG.ICC_PATH);
    appState.iccBytes = iccBytes;
    appState.iccpChunkData = await buildICCPChunkData(CFG.ICC_PROFILE_NAME, iccBytes);
  } catch (e) {
    showFatal(`ICCプロファイルの読み込みに失敗しました: ${String(e?.message ?? e)}`);
    disableInputs();
    return;
  }

  // 2) ファイル選択
  dom.btnOpen.addEventListener("click", () => dom.fileInput.click());
  dom.fileInput.addEventListener("change", async () => {
    const f = dom.fileInput.files?.[0];
    if (!f) return;
    await handleFile(f);
    dom.fileInput.value = ""; // 同じファイル再選択対策
  });

  // 3) Drag & Drop(パソコン情報のみ。スマホでも動く場合は動く)
  dom.dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dom.dropZone.classList.add("drag");
  });
  dom.dropZone.addEventListener("dragleave", () => dom.dropZone.classList.remove("drag"));
  dom.dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dom.dropZone.classList.remove("drag");
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    await handleFile(f);
  });
}

function buildOutputFilename(options) {
  const pad2 = (n) => String(n).padStart(2, "0");
  const now = new Date();
  const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  const cs = pad2(Math.floor(now.getMilliseconds() / 10));
  const [r, g, b] = options.bg;
  const tol = options.tolerance;
  const strength = options.strength.toFixed(2);
  return `glow_rgb${r},${g},${b}_tol${tol}_s${strength}_${date}_${time}.${cs}.png`;
}

function disableInputs() {
  dom.btnOpen.disabled = true;
  dom.btnOptions.disabled = true;
  dom.dropZone.classList.add("disabled");
}

async function handleFile(file) {
  try {
    validateFileOrThrow(file, CFG);
    appState.lastFile = file;

    // Before表示
    const beforeUrl = URL.createObjectURL(file);
    setImgSrc(dom.imgBefore, beforeUrl);

    // 画像読込
    const img = await loadImageFromFile(file);

    // 変換【Canvas】
    const { bg, tolerance, strength } = appState.options;
    const canvas = convertToCanvas(img, bg, tolerance, strength);

    // Canvas → PNG Blob
    const rawPngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG生成に失敗しました"))), "image/png");
    });

    // iCCPを挿入(必須)
    const outBlob = await insertICCPIntoPngBlob(rawPngBlob, appState.iccpChunkData);

    // After表示 & DL
    const afterUrl = URL.createObjectURL(outBlob);
    setImgSrc(dom.imgAfter, afterUrl);
    const outputName = buildOutputFilename(appState.options);
    if (dom.downloadLink) {
      setDownloadFromBlob(dom.downloadLink, outBlob, outputName);
    }
  } catch (e) {
    showError(String(e?.message ?? e));
    return;
  }
}

// 実行
bootstrap();
