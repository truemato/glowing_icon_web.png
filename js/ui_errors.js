import { openModal } from "./ui_modal.js";

function errorBody(message) {
  const body = document.createElement("div");
  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.textContent = message;
  body.appendChild(pre);
  return body;
}

export function showError(message) {
  openModal({ title: "エラー", body: errorBody(message) });
}

export function showFatal(message) {
  openModal({ title: "致命的なエラー", body: errorBody(message), closable: false });
}
