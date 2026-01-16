import van from "vanjs-core";
import { settingsState } from "../store";
import { getPresetByName } from "../constants/default-providers";
import { fetchModels, normalizeBaseUrl, toProviderModels } from "../utils/model-fetcher";
import type { AiProvider } from "../types";

const { div, select, option, textarea, label, input, style, button, span, h4 } = van.tags;

export default function () {
  const lblRs2 = van.state("");
  const isLoadingModels = van.state(false);
  const modelFetchError = van.state("");

  // UI mode: "list" = show providers list, "add" = show add custom form
  const uiMode = van.state<"list" | "add">("list");

  // Custom provider form state
  const customName = van.state("");
  const customBaseUrl = van.state("");
  const customApiKey = van.state("");
  const customModelInput = van.state("");
  const fetchedModels = van.state<string[]>([]);

  const showSavedMessage = () => {
    lblRs2.val = "Saved";
    setTimeout(() => (lblRs2.val = ""), 2000);
  };

  const handleProviderChange = (e: Event) => {
    const selectedName = (e.target as HTMLSelectElement).value;
    console.log("[Provider UI] Selected:", selectedName);

    if (selectedName === "__add_new__") {
      // Switch to add mode
      uiMode.val = "add";
      customName.val = "";
      customBaseUrl.val = "";
      customApiKey.val = "";
      customModelInput.val = "";
      fetchedModels.val = [];
      modelFetchError.val = "";
    } else {
      uiMode.val = "list";
      settingsState.providers.forEach((p) => {
        p.selected = p.name === selectedName;
      });
      showSavedMessage();
    }
  };

  const handleModelChange = (e: Event) => {
    const selectedProvider = settingsState.providers.find((p) => p.selected);
    if (selectedProvider) {
      const selectedModelName = (e.target as HTMLSelectElement).value;
      selectedProvider.models.forEach((m) => {
        m.selected = m.name === selectedModelName;
      });
      showSavedMessage();
    }
  };

  const handleApiKeyChange = (e: Event) => {
    const selectedProvider = settingsState.providers.find((p) => p.selected);
    if (selectedProvider) {
      selectedProvider.apiKey = (e.target as HTMLInputElement).value;
      showSavedMessage();
    }
  };

  const handleBaseUrlChange = (e: Event) => {
    const selectedProvider = settingsState.providers.find((p) => p.selected);
    if (selectedProvider) {
      selectedProvider.baseUrl = normalizeBaseUrl((e.target as HTMLInputElement).value);
      showSavedMessage();
    }
  };

  // Fetch models for current provider
  const handleFetchModels = async () => {
    const selectedProvider = settingsState.providers.find((p) => p.selected);
    if (!selectedProvider) return;

    isLoadingModels.val = true;
    modelFetchError.val = "";

    const result = await fetchModels(selectedProvider, true);

    isLoadingModels.val = false;

    if (result.error) {
      modelFetchError.val = result.error;
    }

    if (result.models.length > 0) {
      selectedProvider.models = toProviderModels(result.models, selectedProvider.models.find((m) => m.selected)?.name);
      showSavedMessage();
    }
  };

  // Fetch models for custom provider form
  const handleFetchCustomModels = async () => {
    console.log("[Custom] Fetching models...");
    console.log("[Custom] baseUrl:", customBaseUrl.val);

    if (!customBaseUrl.val || !customApiKey.val) {
      modelFetchError.val = "Please enter Base URL and API Key first";
      return;
    }

    isLoadingModels.val = true;
    modelFetchError.val = "";

    const tempProvider: AiProvider = {
      name: "temp",
      baseUrl: normalizeBaseUrl(customBaseUrl.val),
      apiKey: customApiKey.val,
      models: [],
      selected: false,
      isCustom: true,
      supportsModelsEndpoint: true
    };

    console.log("[Custom] Calling fetchModels with baseUrl:", tempProvider.baseUrl);
    const result = await fetchModels(tempProvider, true);
    console.log("[Custom] fetchModels result:", result);

    isLoadingModels.val = false;

    if (result.error) {
      modelFetchError.val = result.error;
      fetchedModels.val = result.models;
    } else {
      fetchedModels.val = result.models;
      modelFetchError.val = "";
    }
  };

  // Save custom provider
  const handleSaveCustomProvider = () => {
    const baseUrl = normalizeBaseUrl(customBaseUrl.val);

    // Get model from dropdown or manual input
    let modelName = customModelInput.val.trim();
    if (fetchedModels.val.length > 0 && !modelName) {
      // Get from select element if exists
      const selectEl = document.getElementById("custom-model-select") as HTMLSelectElement | null;
      modelName = selectEl?.value || fetchedModels.val[0];
    }

    if (!baseUrl || !customApiKey.val || !modelName) {
      modelFetchError.val = "Please fill in Base URL, API Key, and Model";
      return;
    }

    // Generate name from user input or domain
    let providerName = customName.val.trim();
    if (!providerName) {
      try {
        const domain = new URL(baseUrl).hostname.replace(/^api\./, "").split(".")[0];
        providerName = `${domain}/${modelName}`.slice(0, 30);
      } catch {
        providerName = `custom/${modelName}`.slice(0, 30);
      }
    }

    const newProvider: AiProvider = {
      name: providerName,
      baseUrl,
      apiKey: customApiKey.val,
      models: fetchedModels.val.length > 0
        ? toProviderModels(fetchedModels.val, modelName)
        : [{ name: modelName, selected: true }],
      selected: true,
      isCustom: true,
      supportsModelsEndpoint: true
    };

    // Deselect all other providers
    settingsState.providers.forEach((p) => (p.selected = false));

    // Add to providers list
    settingsState.providers.push(newProvider);

    // Reset form and go back to list
    uiMode.val = "list";
    customName.val = "";
    customBaseUrl.val = "";
    customApiKey.val = "";
    fetchedModels.val = [];
    customModelInput.val = "";
    modelFetchError.val = "";

    showSavedMessage();
  };

  // Delete custom provider
  const handleDeleteProvider = () => {
    const selectedProvider = settingsState.providers.find((p) => p.selected);
    if (!selectedProvider || !selectedProvider.isCustom) return;

    const index = settingsState.providers.indexOf(selectedProvider);
    if (index > -1) {
      settingsState.providers.splice(index, 1);
      // Select first provider
      if (settingsState.providers.length > 0) {
        settingsState.providers[0].selected = true;
      }
      showSavedMessage();
    }
  };

  // Cancel add mode
  const handleCancelAdd = () => {
    uiMode.val = "list";
    modelFetchError.val = "";
    // Select first provider if none selected
    const hasSelected = settingsState.providers.some((p) => p.selected);
    if (!hasSelected && settingsState.providers.length > 0) {
      settingsState.providers[0].selected = true;
    }
  };

  // Render provider list form
  const renderProviderForm = () => {
    const selectedProvider = settingsState.providers.find((p) => p.selected);
    const isCustomProvider = selectedProvider?.isCustom === true;
    const preset = selectedProvider ? getPresetByName(selectedProvider.name) : null;

    return div(
      // Provider dropdown
      div(
        { class: "pure-control-group" },
        label({ class: "form-label" }, "Provider"),
        select(
          { class: "pure-input-1", onchange: handleProviderChange },
          ...settingsState.providers.map((p) =>
            option({ selected: p.selected, value: p.name }, p.name + (p.isCustom ? " ★" : ""))
          ),
          option({ value: "__add_new__" }, "+ Add Custom Provider...")
        )
      ),

      // Base URL (editable for all providers)
      div(
        { class: "pure-control-group" },
        label({ class: "form-label" }, "Base URL"),
        div({ class: "pure-g" },
          div({ class: "pure-u-19-24" },
            input({
              type: "text",
              class: "pure-input-1",
              value: selectedProvider?.baseUrl || "",
              onblur: handleBaseUrlChange
            })
          ),
          div({ class: "pure-u-5-24", style: "padding-left: 5px;" },
            preset
              ? button(
                  {
                    class: "pure-button",
                    title: "Reset to default",
                    onclick: () => {
                      if (selectedProvider && preset) {
                        selectedProvider.baseUrl = preset.baseUrl;
                        showSavedMessage();
                      }
                    }
                  },
                  "Reset"
                )
              : null
          )
        )
      ),

      // Model selection with fetch button
      div(
        { class: "pure-control-group" },
        label({ class: "form-label" }, "Model"),
        div({ class: "pure-g" },
          div({ class: "pure-u-19-24" },
            select(
              { class: "pure-input-1", onchange: handleModelChange },
              ...(selectedProvider?.models || []).map((m) =>
                option({ selected: m.selected, value: m.name }, m.name)
              )
            )
          ),
          div({ class: "pure-u-5-24", style: "padding-left: 5px;" },
            button(
              {
                class: "pure-button",
                disabled: isLoadingModels.val,
                title: "Fetch latest models from API",
                onclick: handleFetchModels
              },
              () => (isLoadingModels.val ? "..." : "Fetch")
            )
          )
        ),
        () => modelFetchError.val ? span({ class: "error-message" }, modelFetchError.val) : null
      ),

      // API Key
      div(
        { class: "pure-control-group" },
        label({ class: "form-label" }, "API Key"),
        textarea({
          rows: 4,
          class: "pure-input-1",
          placeholder: "Enter your API key",
          value: selectedProvider?.apiKey || "",
          onblur: handleApiKeyChange
        })
      ),

      // Delete button for custom providers
      isCustomProvider
        ? div(
            { class: "pure-control-group" },
            button(
              {
                class: "pure-button button-danger",
                onclick: handleDeleteProvider
              },
              "Delete This Provider"
            )
          )
        : null,

      // Provider note
      selectedProvider?.note
        ? div({ class: "pure-control-group" }, div({ innerHTML: selectedProvider.note }))
        : null
    );
  };

  // Render add custom form
  const renderAddCustomForm = () => {
    return div(
      { class: "custom-provider-form" },
      h4({ style: "margin-top: 0;" }, "Add Custom Provider"),

      // Name (optional)
      div(
        { class: "pure-control-group" },
        label({ class: "form-label" }, "Name (optional)"),
        input({
          type: "text",
          class: "pure-input-1",
          placeholder: "My Custom API",
          id: "custom-name-input",
          oninput: (e: Event) => {
            customName.val = (e.target as HTMLInputElement).value;
          }
        })
      ),

      // Base URL
      div(
        { class: "pure-control-group" },
        label({ class: "form-label" }, "Base URL *"),
        input({
          type: "text",
          class: "pure-input-1",
          placeholder: "https://api.example.com/v1",
          id: "custom-baseurl-input",
          oninput: (e: Event) => {
            customBaseUrl.val = (e.target as HTMLInputElement).value;
          }
        })
      ),

      // API Key
      div(
        { class: "pure-control-group" },
        label({ class: "form-label" }, "API Key *"),
        textarea({
          class: "pure-input-1",
          placeholder: "sk-...",
          id: "custom-apikey-input",
          rows: 3,
          oninput: (e: Event) => {
            customApiKey.val = (e.target as HTMLTextAreaElement).value;
          }
        })
      ),

      // Fetch Models button
      div(
        { class: "pure-control-group" },
        button(
          {
            class: "pure-button pure-button-primary",
            onclick: handleFetchCustomModels
          },
          () => (isLoadingModels.val ? "Loading..." : "Fetch Models")
        )
      ),

      // Error display
      () => modelFetchError.val
        ? div({ class: "error-message" }, modelFetchError.val)
        : null,

      // Model dropdown (if fetched)
      () => fetchedModels.val.length > 0
        ? div(
            { class: "pure-control-group" },
            label({ class: "form-label" }, "Model"),
            select(
              {
                class: "pure-input-1",
                id: "custom-model-select",
                onchange: (e: Event) => {
                  // Store selected model index for later
                  const select = e.target as HTMLSelectElement;
                  customModelInput.val = select.value;
                }
              },
              ...fetchedModels.val.map((m, i) =>
                option({ value: m, selected: i === 0 }, m)
              )
            )
          )
        : null,

      // Manual model input (fallback when fetch fails)
      () => (modelFetchError.val && fetchedModels.val.length === 0)
        ? div(
            { class: "pure-control-group" },
            label({ class: "form-label" }, "Model (manual) *"),
            input({
              type: "text",
              class: "pure-input-1",
              placeholder: "gpt-4o",
              id: "custom-model-input",
              oninput: (e: Event) => {
                customModelInput.val = (e.target as HTMLInputElement).value;
              }
            })
          )
        : null,

      // Action buttons
      div(
        { class: "pure-control-group", style: "display: flex; gap: 10px;" },
        button(
          {
            class: "pure-button button-success",
            onclick: handleSaveCustomProvider
          },
          "Save Provider"
        ),
        button(
          {
            class: "pure-button",
            onclick: handleCancelAdd
          },
          "Cancel"
        )
      )
    );
  };

  return div(
    div(
      { class: "pure-g", style: "padding: 0 0.5em;" },
      div(
        { class: "pure-u-1" },
        div(
          { class: "pure-form pure-form-stacked" },

          // Conditional render based on mode
          () => uiMode.val === "add" ? renderAddCustomForm() : renderProviderForm(),

          // VietPhrase checkbox (always visible)
          div(
            { class: "pure-control-group", style: "margin: 5px 0px;" },
            label(
              { class: "pure-checkbox" },
              input({
                type: "checkbox",
                checked: settingsState.isVietPharseFirst && settingsState.isVietPharseFirst === true,
                onchange: (e: Event) => {
                  settingsState.isVietPharseFirst = (e.target as HTMLInputElement).checked;
                }
              }),
              " Use VietPhrase to translate first?"
            )
          ),

          // Saved message
          label({ class: "saved-message" }, () => lblRs2.val)
        )
      )
    ),
    style(`
      .ai-provider-container {
        max-width: 600px;
        margin: 0 auto;
      }
      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }
      .saved-message {
        color: #00aa00;
        margin: 0.5rem 0;
        font-size: 0.9rem;
        font-weight: bold;
        text-align: center;
        display: block;
      }
      textarea.pure-input-1 {
        resize: none;
        min-height: 100px;
      }
      .custom-provider-form {
        padding: 1rem;
        background: #f9f9f9;
        border-radius: 4px;
        margin: 0.5rem 0;
        border: 1px solid #ddd;
      }
      .error-message {
        color: #cc0000;
        padding: 0.5rem 0;
        font-size: 0.9rem;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .button-success {
        background: #1cb841 !important;
        color: white !important;
      }
      .button-danger {
        background: #ca3c3c !important;
        color: white !important;
      }
    `)
  );
}
