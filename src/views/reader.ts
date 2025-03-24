import { define } from "vanjs-element";
import { Readability } from "@mozilla/readability";
import van from "vanjs-core";
import { getFromHistory } from "../cached";
import { appState } from "../store";
import { translateFunc, bionicReading } from "../utils";
import * as ConfigChaptersLink from "../components/chapters";

const { div } = van.tags;

define("reader-view", ({mount}) => {
    const container = div({class: "content-container"});
    
    mount(() => {
        (async () => {
            const cached =  await getFromHistory(window.location.href);
            if(cached){
                container.innerHTML = bionicReading(cached);
                // console.log(findPrevNextChapterLinks())
                ConfigChaptersLink.visbile()
            }else{
                container.innerText = "[Xin đợi...]"
                const documentClone = document.cloneNode(true) as Document;
                const article = new Readability(documentClone).parse();
                // let translated = ""
                await translateFunc(article?.content, (chunk: string ) => {
                    container.innerHTML = bionicReading(chunk);
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