import van from "vanjs-core";
import { define } from "vanjs-element";
import { Await } from "vanjs-ui";
import BottomBar from "./components/bottombar";
import ModalReaderConfig from "./components/readerConfig";
import CurrentView from "./views";
import { initStore, settingsState } from "./store";
import { fetchResource } from "./utils";

const { style } = van.tags;

const pureCss = "https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/pure-min.css"; 
await initStore();

define("dichtruyen-ai", () => {
  // const readerView = van.derive(() => settingsState.readerView);
  // const textColor = van.derive(() => readerView.val.backgroundColor === "black" ? "white" : "black");
  
  const readerStyles = van.derive(() => {
    const textColor = settingsState.readerView.backgroundColor === "black" ? "white" : "black"
    return `
    reader-view {
      background-color: ${settingsState.readerView.backgroundColor} !important;
    }
    .content-container {
      font-family: ${settingsState.readerView.fontFamily}, -apple-system, sans-serif;
      line-height: ${settingsState.readerView.lineHeight};
      font-size: ${settingsState.readerView.fontSize}px;
      color: ${textColor};
      margin: 5px auto;
      padding: 10px;
      box-sizing: border-box;
      width: 100%;
      max-width: 800px;
      white-space: pre-wrap;
    }
    .article-title {
      font-size: 1.5em;
      font-weight: bold;
      margin-bottom: 1em;
      text-align: center;
    }
  `
  });

  return [
    style(`
          :host {
            display: block;
            height: 100%;
            width: 100%;
            pointer-events: all;
          }
        #bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
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
          z-index: 9999;
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
        #mdlReaderContainer p{
          margin: 5px 0px;
        }
      `),
    style(`
      #view {
          width: 100%;
          height: 100%;
          background-color: white;
        }
        history-view, settings-view, reader-view {
          display: block;
          width: 100%;

          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          z-index: 9999;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 60px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background-color: white;
        }
      `),
    style(readerStyles),
    Await({
      value: fetchResource(pureCss),
      container: style,
      Loading: () => '',
    }, (data) => data),
    style(`
    .button-success,
        .button-error,
        .button-warning,
        .button-secondary {
            color: white;
            border-radius: 4px;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
        }

        .button-success {
            background: rgb(28, 184, 65);
            /* this is a green */
        }

        .button-error {
            background: rgb(202, 60, 60);
            /* this is a maroon */
        }

        .button-warning {
            background: rgb(223, 117, 20);
            /* this is an orange */
        }

        .button-secondary {
            background: rgb(66, 184, 221);
            /* this is a light blue */
        }  
      `),
    CurrentView(),
    ModalReaderConfig(),
    BottomBar(),
  ];
});
