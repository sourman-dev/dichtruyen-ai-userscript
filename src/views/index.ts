import van from "vanjs-core";
import { appState } from "../store";
import "./history";
import "./reader";
import "./settings";

const { div } = van.tags;


export default () => {
  const dom = div();
  van.derive(() =>{
    if(appState.currentView !== "empty"){
      dom.id = "view";
      if(dom.childElementCount > 0){
        for(const el of dom.childNodes){
          el.remove();
        }
      }
      const el = document.createElement(`${appState.currentView}-view`);
      dom.appendChild(el);
    }else{
      dom.id = "";
      if(dom.childElementCount > 0){
        for(const el of dom.childNodes){
          el.remove();
        }
      }
    }
  });
  return dom;
};
