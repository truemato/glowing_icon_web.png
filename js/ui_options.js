import { dom } from "./dom.js";
import { openModal, closeModal } from "./ui_modal.js";
import { clamp } from "./utils.js";

function makeRow(labelText, inputEl, valueEl) {
  const row = document.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = "90px 1fr 90px";
  row.style.alignItems = "center";
  row.style.gap = "8px";
  const label = document.createElement("div");
  label.textContent = labelText;
  row.append(label, inputEl, valueEl);
  return row;
}

function makeNumberInput(min, max, step, value) {
  const input = document.createElement("input");
  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  return input;
}

export function wireOptionsUI(appState, onApply) {
  dom.btnOptions.addEventListener("click", () => {
    const temp = {
      bg: [...appState.options.bg],
      tolerance: appState.options.tolerance,
      strength: appState.options.strength
    };

    const body = document.createElement("div");
    body.style.display = "grid";
    body.style.gap = "10px";

    const bgWrap = document.createElement("div");
    bgWrap.style.display = "grid";
    bgWrap.style.gridTemplateColumns = "repeat(3, 1fr)";
    bgWrap.style.gap = "12px";
    const bgLabels = ["R", "G", "B"];
    const bgInputs = temp.bg.map((value) => makeNumberInput(0, 255, 1, value));
    const bgValue = document.createElement("div");
    bgValue.textContent = temp.bg.join(", ");
    bgInputs.forEach((input, index) => {
      input.style.width = "44px";
      input.addEventListener("input", () => {
        const value = clamp(Number(input.value), 0, 255);
        input.value = String(value);
        temp.bg[index] = value;
        bgValue.textContent = temp.bg.join(", ");
      });
      const inputWrap = document.createElement("div");
      inputWrap.style.display = "flex";
      inputWrap.style.alignItems = "center";
      inputWrap.style.gap = "0px";
      inputWrap.style.columnGap = "0px";
      const label = document.createElement("span");
      label.textContent = bgLabels[index];
      inputWrap.append(label, input);
      bgWrap.appendChild(inputWrap);
    });

    const tolInput = document.createElement("input");
    tolInput.type = "range";
    tolInput.min = "0";
    tolInput.max = "255";
    tolInput.step = "1";
    tolInput.value = String(temp.tolerance);
    tolInput.style.width = "calc(100% - 60px)";
    const tolValue = document.createElement("div");
    tolValue.textContent = tolInput.value;
    tolInput.addEventListener("input", () => {
      const value = clamp(Number(tolInput.value), 0, 255);
      temp.tolerance = value;
      tolValue.textContent = String(value);
    });

    const strengthInput = document.createElement("input");
    strengthInput.type = "range";
    strengthInput.min = "0";
    strengthInput.max = "2";
    strengthInput.step = "0.01";
    strengthInput.value = String(temp.strength);
    strengthInput.style.width = "calc(100% - 60px)";
    const strengthValue = document.createElement("div");
    strengthValue.textContent = strengthInput.value;
    strengthInput.addEventListener("input", () => {
      const value = clamp(Number(strengthInput.value), 0, 2);
      temp.strength = value;
      strengthValue.textContent = value.toFixed(2);
    });

    body.append(
      makeRow("Background", bgWrap, bgValue),
      makeRow("Tolerance", tolInput, tolValue),
      makeRow("Strength", strengthInput, strengthValue)
    );

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    footer.style.gap = "20px";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn";
    cancelBtn.textContent = "キャンセル";
    cancelBtn.style.background = "rgb(200, 200, 200)";
    cancelBtn.style.borderColor = "rgb(200, 200, 200)";
    cancelBtn.style.color = "#111";
    cancelBtn.style.minWidth = "120px";
    cancelBtn.style.height = "36px";
    cancelBtn.style.justifyContent = "center";

    const okBtn = document.createElement("button");
    okBtn.className = "btn btn-primary";
    okBtn.textContent = "OK";
    okBtn.style.minWidth = "120px";
    okBtn.style.height = "36px";
    okBtn.style.justifyContent = "center";

    const applyOptions = () => {
      appState.options.bg = [...temp.bg];
      appState.options.tolerance = temp.tolerance;
      appState.options.strength = temp.strength;
      closeModal();
      if (typeof onApply === "function") {
        onApply();
      }
    };

    okBtn.addEventListener("click", applyOptions);
    cancelBtn.addEventListener("click", closeModal);

    footer.append(okBtn, cancelBtn);

    const onKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyOptions();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
      }
    };
    document.addEventListener("keydown", onKeyDown, { once: true });

    openModal({ title: "オプション", body, footer });
  });
}
