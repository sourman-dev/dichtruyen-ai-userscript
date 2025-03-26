import { define } from "vanjs-element";
import { Readability } from "@mozilla/readability";
import { textVide } from "text-vide";
import van from "vanjs-core";
import { getFromHistory } from "../cached";
import { appState, settingsState } from "../store";
import { translateFunc } from "../utils";
import * as ConfigChaptersLink from "../components/chapters";

const { div } = van.tags;

define("reader-view", ({mount}) => {
    const container = div({class: "content-container"});
    const bionicReading = van.state(false);
    
    mount(() => {
        (async () => {
            const cached =  await getFromHistory(window.location.href);
            van.derive(() => {
                bionicReading.val = settingsState.readerView.bionicReading;
                if(cached){
                    container.innerHTML = bionicReading.val === true ? textVide(cached) : cached;
                    ConfigChaptersLink.visbile()
                    // console.log('////')
                }
            })
            if(!cached){
                container.innerText = "[Xin đợi...]"
                const documentClone = document.cloneNode(true) as Document;
                const article = new Readability(documentClone).parse();
                // let translated = ""
                await translateFunc(article?.content, (chunk: string ) => {
                    container.innerHTML = bionicReading.val === true ? textVide(chunk) : chunk;
                });
                ConfigChaptersLink.visbile();
            }
        })();
        return () => {
            van.derive(async () => {
                if(appState.isTranslating === true){
                    appState.isTranslating = false;
                    window.location.reload();
                }
            })
        }
    })
    return [ConfigChaptersLink.render, container, ConfigChaptersLink.render]
}, false)