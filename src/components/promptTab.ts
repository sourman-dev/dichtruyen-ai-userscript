import van from "vanjs-core";
import { settingsState } from "../store";
const { div, select, option, textarea, label, button } = van.tags;

interface Prompt {
    name: string;
    content: string;
    selected: boolean;
}

const feedbackText = van.state('');

function showSavedFeedback() {
    feedbackText.val = 'Saved';
    setTimeout(() => {
        feedbackText.val = '';
    }, 2000);
}

function PromptSelector({ 
    lbl, 
    prompts, 
    onSelect,
    onContentChange 
}: { 
    lbl: string, 
    prompts: Prompt[], 
    onSelect: (value: string) => void,
    onContentChange: (name: string, newContent: string) => void 
}) {
    const selectedPrompt = prompts.find(p => p.selected) || prompts[0];
    const content = van.state(selectedPrompt?.content || '');

    return div(
        { class: 'pure-g', style: 'padding: 0 0.5em; margin-bottom: 0.5em;' },
        div({ class: 'pure-u-1' },
            label({ class: '' }, lbl),
            div({ class: 'pure-form pure-form-stacked' },
                div({ class: 'pure-g', style: 'padding-right: 1em' },
                    div({ class: 'pure-u-20-24' },
                        select(
                            {
                                class: 'pure-input-1',
                                value: selectedPrompt?.name,
                                onchange: (e: Event) => {
                                    const value = (e.target as HTMLSelectElement).value;
                                    onSelect(value);
                                    const newSelected = prompts.find(p => p.name === value);
                                    content.val = newSelected?.content || '';
                                    showSavedFeedback();
                                }
                            },
                            ...prompts.map(p => option({ value: p.name }, p.name))
                        )
                    ),
                    div({ class: 'pure-u-4-24' },
                        button({ 
                            class: 'pure-button',
                            style: 'margin-left: 0.5em; width: 40px; height: 30.5px; margin-top: 4px; padding: 0; line-height: 2.3em;'
                        }, '+')
                    )
                )
            )
        ),
        div({ class: 'pure-u-1',  style: 'padding-right: 1em' },
            textarea(
                {
                    class: 'pure-input-1',
                    style: 'height: 150px; margin-top: 1em; resize: vertical; display: block; box-sizing: border-box; width: 100%;',
                    value: content,
                    onblur: (e: Event) => {
                        const newContent = (e.target as HTMLTextAreaElement).value;
                        content.val = newContent;
                        if (selectedPrompt) {
                            onContentChange(selectedPrompt.name, newContent);
                        }
                        showSavedFeedback();
                    }
                }
            )
        )
    );
}

export default function() {
    return [
        div(
            { class: 'pure-g' },
            div({ class: 'pure-u-1' },
                PromptSelector({
                    lbl: 'System Prompts',
                    prompts: settingsState.prompt.systemPrompts.map(p => ({
                        name: p.name,
                        content: p.content || '',
                        selected: p.selected
                    })),
                    onSelect: (value) => {
                        settingsState.prompt.systemPrompts.forEach(p => p.selected = p.name === value);
                    },
                    onContentChange: (name, newContent) => {
                        const prompt = settingsState.prompt.systemPrompts.find(p => p.name === name);
                        if (prompt) prompt.content = newContent;
                    }
                }),
                PromptSelector({
                    lbl: 'User Prompts',
                    prompts: settingsState.prompt.userPrompts.map(p => ({
                        name: p.name,
                        content: p.content || '',
                        selected: p.selected
                    })),
                    onSelect: (value) => {
                        settingsState.prompt.userPrompts.forEach(p => p.selected = p.name === value);
                    },
                    onContentChange: (name, newContent) => {
                        const prompt = settingsState.prompt.userPrompts.find(p => p.name === name);
                        if (prompt) prompt.content = newContent;
                    }
                })
            )
        ),
        label({ 
            id: "lblRs1",
            class: 'pure-form-message-inline',
            style: 'color: green; text-align: center; display: block; width: 100%'
        }, feedbackText)
    ]
}