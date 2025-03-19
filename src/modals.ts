import van from "vanjs-core";
import { Tabs, Await } from "vanjs-ui";
import type { State } from "vanjs-core";
import * as vanX from "vanjs-ext";
import { AppState, aiProvider } from "./app";
import { deleteHistoryItem, getFromHistory } from "./history";

const { button, div, input, label, a, span } = van.tags;

class SettingsModalElement extends HTMLElement {
  // private closed: State<boolean> = van.state(false);
  private tempSettings: any;
  private appState!: AppState;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    if (this.shadowRoot) {
      // Add click event listener to prevent event propagation
      this.shadowRoot.addEventListener(
        "click",
        (e) => {
          const target = e.target as HTMLElement;
          if (!target.closest(".modal-content")) {
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        },
        true
      );

      const style = document.createElement("style");
      style.textContent = `
        :host {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-content {
          padding: clamp(10px, 3vw, 20px);
          width: clamp(280px, 90vw, 600px);
          max-height: calc(100vh - 20px);
          margin: clamp(5px, 2vw, 10px);
          overflow-y: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .input-group {
          margin-bottom: clamp(10px, 3vw, 15px);
        }
        .input-label {
          display: block;
          margin-bottom: 5px;
        }
        .input-field {
          width: 100%;
          padding: clamp(6px, 2vw, 8px);
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .textarea-field {
          min-height: clamp(150px, 30vh, 200px);
        }
        .button-group {
          display: flex;
          justify-content: flex-end;
          gap: clamp(6px, 2vw, 10px);
          margin-top: clamp(15px, 4vw, 20px);
        }
        .button {
          padding: clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px);
          border-radius: 4px;
          cursor: pointer;
        }
        .cancel-button {
          border: 1px solid #ddd;
          background: white;
        }
        .save-button {
          background: #4CAF50;
          color: white;
          border: none;
        }
        .font-size-controls {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-button {
          background: none;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 4px 12px;
          cursor: pointer;
          font-size: 18px;
        }
        .icon-button:hover {
          background: #f5f5f5;
        }
      `;
      this.shadowRoot.appendChild(style);
    }
  }

  private availableFonts: string[] = [];
  private availableColors: { [key: string]: string }[] = [];
  private avaibleLineHeights: string[] = ["1.6", "1", "1.2", "1.4", "1.8", "2"];
  async initialize(appState: AppState) {
    this.appState = appState;
    // this.closed = van.state(false);

    // Load available fonts
    // const { detectAvailableFonts } = await import('./fonts');
    this.availableFonts = [
      "Palatino Linotype",
      "Bookerly",
      "Segoe UI",
      "Patrick Hand",
      "Times New Roman",
      "Verdana",
      "Tahoma",
    ];
    this.availableColors = [
      {
        name: "Light Gray",
        value: "#F4F4F4",
      },
      {
        name: "Light Blue",
        value: "#E8EBEE",
      },
      {
        name: "Deep Blue",
        value: "#E1E4F2",
      },
      {
        name: "Light Yellow",
        value: "#F4F4E3",
      },
      {
        name: "Sepia",
        value: "#EAE4D3",
      },
      {
        name: "Deep Yellow",
        value: "#FAFAC8",
      },
      {
        name: "Dark",
        value: "black",
      },
    ];
    const savedProvider = appState.settings.aiProvider.find(p => p.selected)  
    this.tempSettings = vanX.reactive({
      systemPrompt: appState.settings.systemPrompt || "",
      userPrompt: appState.settings.userPrompt || "",
      provider: savedProvider?.name || "Google",
      apiKey: savedProvider?.apiKey || "",
      modelName: savedProvider?.modelName || "gemini-2.0-flash",
      temperature: savedProvider?.temperature || 0.0,
      backgroundColor: appState.readerView?.backgroundColor || "#F4F4F4",
      fontFamily: appState.readerView?.fontFamily || "system-ui",
      lineHeight: appState.readerView?.lineHeight || "1.6",
      fontSize: appState.readerView?.fontSize || 16,
    });
    // console.log(this.tempSettings);
    this.render();
  }

  private handleSave = () => {
    this.appState.settings = {
      ...this.appState.settings,
      systemPrompt: this.tempSettings.systemPrompt,
      userPrompt: this.tempSettings.userPrompt,
      aiProvider: this.appState.settings.aiProvider.map((provider: aiProvider) => ({
        ...provider,
        selected: provider.name === this.tempSettings.provider,
        apiKey: provider.name === this.tempSettings.provider ? this.tempSettings.apiKey : provider.apiKey,
        modelName: provider.name === this.tempSettings.provider ? this.tempSettings.modelName : provider.modelName,
        temperature: provider.name === this.tempSettings.provider ? this.tempSettings.temperature : provider.temperature
      })) as aiProvider[],
    };

    this.appState.readerView = {
      backgroundColor: this.tempSettings.backgroundColor,
      fontFamily: this.tempSettings.fontFamily,
      lineHeight: this.tempSettings.lineHeight,
      fontSize: this.tempSettings.fontSize,
    };
    this.remove();
  };

  private createInput = (
    label1: string,
    value: State<string | number>,
    onChange: (val: string) => void,
    options?: { type?: "input" | "textarea"; readonly?: boolean }
  ) => {
    const inputProps = {
      value,
      onchange: (e: Event) => onChange((e.target as HTMLInputElement).value),
      class: `input-field ${
        options?.type === "textarea" ? "textarea-field" : ""
      }`,
    } as any;

    if (options?.readonly) {
      inputProps["readonly"] = true;
    }

    return div(
      { class: "input-group" },
      label({ class: "input-label" }, label1),
      options?.type === "textarea"
        ? van.tags.textarea(inputProps)
        : input(inputProps)
    );
  };

  private render() {
    if (this.shadowRoot) {
      let currentTab = van.state("Display");
        
      // console.log(this.appState?.readerView?.backgroundColor, this.tempSettings.backgroundColor)
      const content = div(
        { class: "modal-content" },
        Tabs(
          {
            activeTab: currentTab,
            style: "width: 100%;",
            tabButtonActiveColor: "#F44336",
            tabButtonBorderStyle: "none",
            tabButtonRowStyleOverrides: {
              "padding-left": "clamp(8px, 2vw, 12px)",
              "border-bottom": "1px solid red",
            },
          },
          {
            Display: div(
              div(
                { class: "input-group" },
                label({ class: "input-label" }, "Background Color"),
                van.tags.select(
                  {
                    class: "input-field",
                    onchange: (e) =>
                      (this.tempSettings.backgroundColor = (
                        e.target as HTMLSelectElement
                      ).value),
                  },
                  this.availableColors.map((color) =>
                    van.tags.option(
                      {
                        value: color.value,
                        selected:
                          this.appState?.readerView?.backgroundColor ===
                          color.value,
                      },
                      color.name
                    )
                  )
                )
              ),
              div(
                { class: "input-group" },
                label({ class: "input-label" }, "Font Family"),
                van.tags.select(
                  {
                    class: "input-field",
                    onchange: (e) =>
                      (this.tempSettings.fontFamily = (
                        e.target as HTMLSelectElement
                      ).value),
                  },
                  this.availableFonts.map((font) =>
                    van.tags.option(
                      {
                        value: font,
                        selected:
                          this.appState?.readerView?.fontFamily === font,
                      },
                      font
                    )
                  )
                )
              ),
              div(
                { class: "input-group" },
                label({ class: "input-label" }, "Line Height"),
                van.tags.select(
                  {
                    class: "input-field",
                    onchange: (e) =>
                      (this.tempSettings.lineHeight = (
                        e.target as HTMLSelectElement
                      ).value),
                  },
                  this.avaibleLineHeights.map((lineHeight) =>
                    van.tags.option(
                      {
                        value: lineHeight,
                        selected:
                          this.appState?.readerView?.lineHeight === lineHeight,
                      },
                      lineHeight
                    )
                  )
                )
              ),
              div(
                { class: "input-group" },
                label({ class: "input-label" }, "Font Size"),
                div(
                  { class: "font-size-controls" },
                  button(
                    {
                      onclick: () =>
                        (this.tempSettings.fontSize =
                          (this.tempSettings.fontSize || 16) - 2),
                      class: "icon-button",
                    },
                    "−"
                  ),
                  span(
                    { style: "margin: 0 10px;" },
                    () => `${this.tempSettings.fontSize || 16}px`
                  ),
                  button(
                    {
                      onclick: () =>
                        (this.tempSettings.fontSize =
                          (this.tempSettings.fontSize || 16) + 2),
                      class: "icon-button",
                    },
                    "+"
                  )
                )
              )
            ),
            Prompt: div(
              this.createInput(
                "System Prompt",
                this.tempSettings.systemPrompt as any,
                (val) => (this.tempSettings.systemPrompt = val),
                { type: "textarea"}
              ),
              this.createInput(
                "User Prompt (Gắn kèm vào bên dưới System Prompt)",
                this.tempSettings.userPrompt as any,
                (val) => (this.tempSettings.userPrompt = val),
                { type: "textarea" }
              )
            ),
            AI: div(
              div(
                { class: "input-group" },
                label({ class: "input-label" }, "Provider"),
                van.tags.select(
                  {
                    class: "input-field",
                    onchange: (e) => {
                      
                      const getProvider = this.appState.settings.aiProvider.find(p => p.name === (e.target as HTMLSelectElement).value);
                      console.info("change provider", getProvider?.name);
                      this.tempSettings.provider = getProvider?.name || "Google";
                      this.tempSettings.apiKey = getProvider?.apiKey || "";
                      this.tempSettings.modelName = getProvider?.modelName || "gemini-2.0-flash";
                      this.tempSettings.temperature = getProvider?.temperature || 0.0;
                      // if (this.tempSettings.provider === "Google") {
                      //   this.tempSettings.modelName = "gemini-2.0-flash";
                      // } else if (this.tempSettings.provider === "Qwen") {
                      //   this.tempSettings.modelName = "qwen-max-latest";
                      // }
                    },
                  },
                  ["Google", "Qwen"].map((provider) =>
                    van.tags.option(
                      {
                        value: provider,
                        selected: this.tempSettings.provider === provider,
                      },
                      provider
                    )
                  )
                )
              ),
              this.createInput(
                "API Key",
                this.tempSettings.apiKey as any,
                (val) => (this.tempSettings.apiKey = val)
              ),
              this.createInput(
                "Model Name",
                this.tempSettings.modelName as any,
                (val) => (this.tempSettings.modelName = val),
                { type: "input", readonly: true }
              ),
              this.createInput(
                "Temperature",
                this.tempSettings.temperature as any,
                (val) =>
                  (this.tempSettings.temperature = parseFloat(val) || 0.0)
              )
            ),
          }
        ),
        div(
          { class: "button-group" },
          button(
            {
              onclick: () => this.remove(),
              class: "button cancel-button",
            },
            "Cancel"
          ),
          button(
            {
              onclick: this.handleSave,
              class: "button save-button",
            },
            "Save"
          )
        )
      );

      this.shadowRoot.appendChild(content);
    }
  }
}

class HistoryModalElement extends HTMLElement {
  private closed: State<boolean> = van.state(false);
  private currentHistory: State<any> = van.state(null);
  private appState!: AppState;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  disconnectedCallback() {
    this.closed.val = true;
  }

  connectedCallback() {
    if (this.shadowRoot) {
      // Add click event listener to prevent event propagation
      this.shadowRoot.addEventListener(
        "click",
        (e) => {
          const target = e.target as HTMLElement;
          if (!target.closest(".modal-content")) {
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        },
        true
      );

      const style = document.createElement("style");
      style.textContent = `
        :host {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-content {
          padding: clamp(10px, 3vw, 20px);
          width: clamp(280px, 90vw, 600px);
          max-height: calc(100vh - clamp(80px, 15vh, 120px));
          margin: clamp(5px, 2vw, 10px) auto;
          overflow-y: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .title {
          font-size: clamp(16px, 2.5vw, 18px);
          font-weight: bold;
          margin-bottom: clamp(10px, 2vw, 15px);
        }
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .history-link {
          text-decoration: none;
          color: #2196F3;
          flex: 1;
        }
        .delete-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
        .button-group {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .cancel-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          background: white;
        }
      `;
      this.shadowRoot.appendChild(style);
    }
  }

  initialize(appState: AppState) {
    this.appState = appState;
    this.closed = van.state(false);
    const currentUrl = window.location.href;
    this.currentHistory = van.state(getFromHistory(currentUrl));

    this.render();
  }

  private handleDeleteHistoryItem = async (url: string) => {
    try {
      await deleteHistoryItem(this.appState, url);
      const currentUrl = window.location.href;
      this.currentHistory.val = getFromHistory(currentUrl);
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete history item:", error);
    }
  };

  private createHistoryItem = (url: string, title: string) => {
    return div(
      { class: "history-item" },
      a(
        {
          href: url,
          class: "history-link",
          onclick: (e: Event) => {
            e.preventDefault();
            window.location.href = url;
            this.remove();
          },
        },
        title
      ),
      button(
        {
          onclick: () => this.handleDeleteHistoryItem(url),
          class: "delete-button",
        },
        "❌"
      )
    );
  };

  private render() {
    if (this.shadowRoot) {
      const content = div(
        { class: "modal-content" },
        div({ class: "title" }, "Translation History"),
        div(
          { style: "margin-bottom: 20px;" },
          Await(
            {
              value: this.currentHistory.val,
              Loading: () => div("Loading translation history..."),
              Error: (error) =>
                div(
                  { style: "color: red;" },
                  "Failed to load history: ",
                  error.message
                ),
            },
            (history) =>
              history
                ? this.createHistoryItem(
                    window.location.href,
                    (history as any)?.title || "Untitled"
                  )
                : div("No translation for current page")
          )
        ),
        div(
          { style: "margin-bottom: 20px;" },
          ...this.appState.history.map((item) =>
            this.createHistoryItem(item.url, item.title)
          )
        ),
        div(
          { class: "button-group" },
          button(
            {
              onclick: () => this.remove(),
              class: "cancel-button",
            },
            "Cancel"
          )
        )
      );

      this.shadowRoot.appendChild(content);
    }
  }
}

customElements.define("settings-modal", SettingsModalElement);
customElements.define("history-modal", HistoryModalElement);

export const settingsModal = (appState: AppState) => {
  const modal = document.createElement(
    "settings-modal"
  ) as SettingsModalElement;
  modal.initialize(appState);
  document.body.appendChild(modal);
};

export const historyModal = (appState: AppState) => {
  const modal = document.createElement("history-modal") as HistoryModalElement;
  modal.initialize(appState);
  document.body.appendChild(modal);
};
