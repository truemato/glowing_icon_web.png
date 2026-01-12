import { CFG } from "./js/config.js";
import { dom } from "./js/dom.js";
import { appState } from "./js/state.js";
import { wireModals } from "./js/ui_modal.js";
import { wireOptionsUI } from "./js/ui_options.js";
import { showFatal, showError } from "./js/ui_errors.js";
import { validateFileOrThrow } from "./js/validators.js";
import { loadImageFromFile, setImgSrc, setDownloadFromBlob } from "./js/image_io.js";
import { convertToCanvas } from "./js/converter.js";
import { loadICCProfileBytes, buildICCPChunkData } from "./js/icc_loader.js";
import { insertICCPIntoPngBlob } from "./js/png_chunk.js";

async function bootstrap() {
  wireModals();
  wireOptionsUI(appState);

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

function disableInputs() {
  dom.btnOpen.disabled = true;
  dom.btnOptions.disabled = true;
  dom.dropZone.classList.add("disabled");
}

async function handleFile(file) {
  try {
    validateFileOrThrow(file, CFG);

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
    setDownloadFromBlob(dom.downloadLink, outBlob, "converted.png");
  } catch (e) {
    showError(String(e?.message ?? e));
  }
}

// 実行
bootstrap();
