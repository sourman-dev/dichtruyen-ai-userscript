import van from "vanjs-core";
import { settingsState, mergeSystemPrompt, mergeProviders } from "../store";
import { getRelease } from "../utils";
const { div, label, button } = van.tags;

async function displayVersion(isForced: boolean = false){
    const release = await getRelease(isForced);
    let i = `Latest version: ${release.version}<br/><b>Link download: </b><a href="${release.fileUrl}" target="blank">dichtruyen.ai.vn.user.js</a><br/>${release.description}`;
    return i;
}

export default function() {
    const versionInfo = van.state("");

    
    const checkUpdate = async () => {
        versionInfo.val = await displayVersion(true)
    };

    return [
        div({ class: "pure-form pure-form-stacked" }, [
            div({ class: "pure-g" ,style: "padding: 0px 0.5em;"}, [
                div({ class: "pure-u-1 pure-u-md-1-2 pure-u-lg-1-3" }, [
                    label({ class: "pure-u-1" }, `Current version: ${settingsState.version}`),
                    div({ 
                        innerHTML: versionInfo,
                        class: "pure-u-1",
                        style: "margin-bottom:20px;border: 1px solid #ccc; min-height: 150px; background: #fff;"
                    }),
                    button({ 
                        onclick: checkUpdate,
                        class: "pure-button pure-button-primary pure-u-1",
                        style: "margin-bottom: 10px"
                    }, "Check Update"),
                    button({ 
                        onclick: async() => await mergeSystemPrompt(settingsState),
                        class: "pure-button button-success pure-u-1",
                        style: "margin-bottom: 10px"
                    }, "Update System Prompt"),
                    button({ 
                        onclick: async() => await mergeProviders(settingsState),
                        class: "pure-button button-success pure-u-1",
                        style: "margin-bottom: 10px"
                    }, "Update AI Providers")
                ])
            ])
        ])
    ];
}