import { dom } from "./dom.js";

let wired = false;

export function wireModals() {
  if (wired) return;
  wired = true;

  dom.modalBackdrop.addEventListener("click", (e) => {
    if (e.target === dom.modalBackdrop) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

export function openModal({ title, body, footer, closable = true }) {
  dom.modalTitle.textContent = title || "";
  dom.modalBody.innerHTML = "";
  dom.modalFooter.innerHTML = "";

  if (typeof body === "string") {
    dom.modalBody.textContent = body;
  } else if (body instanceof Node) {
    dom.modalBody.appendChild(body);
  }

  if (footer instanceof Node) {
    dom.modalFooter.appendChild(footer);
  } else if (closable) {
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn";
    closeBtn.textContent = "閉じる";
    closeBtn.addEventListener("click", closeModal);
    dom.modalFooter.appendChild(closeBtn);
  }

  dom.modalBackdrop.classList.remove("hidden");
}

export function closeModal() {
  dom.modalBackdrop.classList.add("hidden");
}
