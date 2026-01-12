export function validateFileOrThrow(file, cfg) {
  if (!file) {
    throw new Error("ファイルが選択されていません");
  }

  if (file.type && file.type !== cfg.ACCEPT_MIME) {
    throw new Error("PNGファイルのみ対応しています");
  }

  if (!file.name.toLowerCase().endsWith(".png")) {
    throw new Error("拡張子が .png のファイルを選択してください");
  }

  if (file.size > cfg.MAX_BYTES) {
    throw new Error("ファイルサイズが大きすぎます（最大 100MB）");
  }
}
