import styles from "./style.css?inline";

const STYLE_ELEMENT_ID = "vitepress-mermaid-renderer-styles";
let injected = false;

export const ensureStylesInjected = () => {
  if (injected || typeof document === "undefined") {
    return;
  }

  if (document.getElementById(STYLE_ELEMENT_ID)) {
    injected = true;
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  injected = true;
};
