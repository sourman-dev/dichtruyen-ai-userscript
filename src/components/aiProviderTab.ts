import van from "vanjs-core";
import { settingsState } from "../store";
const { div, select, option, textarea, label, style } = van.tags;

export default function() {
    const lblRs2 = van.state("");
    const showSavedMessage = () => {
        lblRs2.val = "Saved";
        setTimeout(() => lblRs2.val = "", 2000);
        // saveGlobalVal();
    };

    const handleProviderChange = (e: Event) => {
        const selectedName = (e.target as HTMLSelectElement).value;
        settingsState.providers.forEach(p => {
            p.selected = p.name === selectedName;
        });
        showSavedMessage();
    };

    const handleModelChange = (e: Event) => {
        const selectedProvider = settingsState.providers.find(p => p.selected);
        if (selectedProvider) {
            const selectedModelName = (e.target as HTMLSelectElement).value;
            selectedProvider.models.forEach(m => {
                m.selected = m.name === selectedModelName;
            });
            showSavedMessage();
        }
    };

    const handleApiKeyChange = (e: Event) => {
        const selectedProvider = settingsState.providers.find(p => p.selected);
        if (selectedProvider) {
            selectedProvider.apiKey = (e.target as HTMLInputElement).value;
            showSavedMessage();
        }
    };

    return div(
        div({ class: "pure-g", style: "padding: 0 0.5em; "},
            div({ class: "pure-u-1" },
                div({ class: "pure-form pure-form-stacked" },
                    div({ class: "pure-control-group" },
                        label({ class: "form-label" }, "Provider"),
                        select(
                            { class: "pure-input-1", onchange: handleProviderChange },
                            ...settingsState.providers.map(p =>
                                option({ selected: p.selected, value: p.name }, p.name)
                            )
                        )
                    ),

                    div({ class: "pure-control-group" },
                        label({ class: "form-label" }, "Model"),
                        select(
                            { class: "pure-input-1", onchange: handleModelChange },
                            (() => {
                                const selectedProvider = settingsState.providers.find(p => p.selected);
                                if (!selectedProvider) {
                                    return [option({ disabled: true }, "Select a provider first")];
                                }
                                return selectedProvider.models.map(m =>
                                    option({ selected: m.selected, value: m.name }, m.name)
                                );
                            })()
                        )
                    ),

                    div({ class: "pure-control-group" },
                        label({ class: "form-label" }, "API Key"),
                        textarea({
                            rows: 4,
                            class: "pure-input-1",
                            placeholder: "Enter your API key",
                            value: () => settingsState.providers?.find(p => p.selected)?.apiKey || "",
                            onblur: handleApiKeyChange
                        })
                    ),
                    div({ class: "pure-control-group" }, 
                        () => {
                            const note = settingsState.providers?.find(p => p.selected)?.note;
                            return note ? div({ innerHTML: note }) : null;
                        }
                    ),
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
            
            @media screen and (max-width: 48em) {

            
            }
        `)
    );
}