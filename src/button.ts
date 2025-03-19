import van from "vanjs-core";
import { Readability } from "@mozilla/readability";
import { textVide } from "text-vide";
import { settingsModal, historyModal } from "./modals";
import type { AppState } from "./app.d";
import { db, getFromHistory } from "./history";
import { translateFunc } from "./utils";
const { span, button } = van.tags;

class BottomBar extends HTMLElement {
  private appState: AppState;

  constructor(appState: AppState) {
    super();
    this.attachShadow({ mode: "open" });
    this.appState = appState;
  }

  private updateStyle() {
    if (!this.shadowRoot) return;

    const style = document.createElement("style");
    style.textContent = `
      :host {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        pointer-events: none;
      }
      .bottom-bar {
        background-color: white;
        box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
        padding: 10px;
        display: flex;
        justify-content: center;
        gap: 20px;
        width: 100%;
        height: auto;
        min-height: 60px;
        box-sizing: border-box;
        -webkit-overflow-scrolling: touch;
        pointer-events: auto;
        isolation: isolate;
      }
      .icon-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        background-color: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        touch-action: manipulation;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
      }
      .icon {
        display: inline-block;
        width: 24px;
        height: 24px;
        background-size: contain;
        background-repeat: no-repeat;
        vertical-align: middle;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  connectedCallback() {
    this.updateStyle();
    if (this.appState) {
      van.derive(() => {
        const readerView = this.appState.readerView;
        if (readerView) {
          this.updateStyle();
        }
      });
    }

    // Add click event listener to shadowRoot to prevent event propagation
    if (this.shadowRoot) {
      this.shadowRoot.addEventListener(
        "click",
        (e) => {
          const target = e.target as HTMLElement;
          if (!target.closest(".icon-button")) {
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        },
        true
      );
    }
  }
}

customElements.define("bottom-bar", BottomBar);

class ReaderView extends HTMLElement {
  private appState: AppState;
  private styleElement: HTMLStyleElement;
  private contentContainer: HTMLDivElement;

  constructor(appState: AppState) {
    super();
    this.attachShadow({ mode: "open" });
    this.appState = appState;
    this.styleElement = document.createElement("style");
    this.contentContainer = document.createElement("div");
    this.contentContainer.className = "content-container";
    this.shadowRoot?.appendChild(this.styleElement);
    this.shadowRoot?.appendChild(this.contentContainer);
    // this.updateStyle();
  }

  updateStyle(appState: AppState) {
    if (!this.shadowRoot) return;
    this.appState = appState;
    // console.log("updateStyle", this.appState);
    const backgroundColor =
      this.appState?.readerView?.backgroundColor || "#F4F4F4";
    const fontFamily = this.appState?.readerView?.fontFamily || "system-ui";
    const lineHeight = this.appState?.readerView?.lineHeight || "1.6";
    const fontSize = this.appState?.readerView?.fontSize || 16;
    const textColor = backgroundColor === "black" ? "white" : "#2B2B2B";

    this.styleElement.textContent = `
      :host {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 60px;
        background: ${backgroundColor};
        color: ${textColor};
        z-index: 9998;
        padding: 5px 5px 5px 5px;
        overflow-y: auto;
        font-family: ${fontFamily}, -apple-system, sans-serif;
        line-height: ${lineHeight};
        font-size: ${fontSize}px;
        font-weight: 400;
        max-width: 100%;
        height: calc(100vh - 60px);
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .content-container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        box-sizing: border-box;
      }
      .article-title {
        font-size: 1.5em;
        font-weight: bold;
        margin-bottom: 1em;
        text-align: center;
      }
    `;
  }

  setContent({ content, title }: { content: string; title: string }) {
    if (!this.shadowRoot) return;

    const titleElement = document.createElement("h1");
    titleElement.className = "article-title";
    titleElement.textContent = title;

    const contentElement = document.createElement("div");
    contentElement.className = "article-content";
    contentElement.style.whiteSpace = "pre-wrap";
    contentElement.innerHTML = content;

    this.contentContainer.innerHTML = "";
    this.contentContainer.appendChild(titleElement);
    this.contentContainer.appendChild(contentElement);

    return contentElement;
  }

  connectedCallback() {
    if (this.appState) {
      van.derive(() => {
        const readerView = this.appState.readerView;
        if (readerView) {
          this.updateStyle(this.appState);
          const contentElement =
            this.shadowRoot?.querySelector(".article-content");
          if (contentElement instanceof HTMLElement) {
            contentElement.style.whiteSpace = "pre-wrap";
          }
        }
      });
    }
  }
}

customElements.define("reader-view", ReaderView);

const toggleReaderMode = async (appState: AppState) => {
  const existingReader = document.querySelector("reader-view");
  if (existingReader) {
    existingReader.remove();
    return;
  }

  const documentClone = document.cloneNode(true) as Document;
  const article = new Readability(documentClone).parse();

  if (article) {
    const readerView = document.createElement("reader-view") as ReaderView;
    document.body.appendChild(readerView);
    readerView.updateStyle(appState);
    const translationContainer = (readerView as any).setContent({
      content: "Translating...",
      title: article.title || "",
    });

    if (translationContainer) {
      let accumulatedText = "";

      // Check if translation exists in cache
      const url = window.location.href;

      const historyItem = await getFromHistory(url);
      let isNeedTranslate = true;
      if (historyItem) {
        const cachedTranslation = await db.get(`translation:${url}`);
        if (cachedTranslation) {
          translationContainer.innerHTML = textVide(cachedTranslation);
          isNeedTranslate = false;
        }
      }
      if (isNeedTranslate) {
        await translateFunc(
          article.textContent || "",
          (chunk) => {
            accumulatedText += chunk;
            translationContainer.innerHTML = textVide(accumulatedText);
          },
          appState
        );
      }
    }
  }
};

export const TranslateButton = (appState: AppState) => {
  const bottomBar = document.createElement("bottom-bar");
  const shadowRoot = bottomBar.shadowRoot;

  if (shadowRoot) {
    const container = document.createElement("div");
    container.className = "bottom-bar";

    const createIconButton = (icon: string, onClick: () => void) => {
      return button(
        {
          onclick: onClick,
          class: "icon-button",
        },
        span({
          class: "icon",
          style: `background-image: url('data:image/svg+xml;utf8,${icon}');`,
        })
      );
    };

    const infoIcon =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
    const translateIcon =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
    const configIcon =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';

    van.add(
      container,
      createIconButton(infoIcon, () => historyModal(appState)),
      createIconButton(translateIcon, () => toggleReaderMode(appState)),
      createIconButton(configIcon, () => settingsModal(appState))
    );

    shadowRoot.appendChild(container);
  }

  return bottomBar;
};
