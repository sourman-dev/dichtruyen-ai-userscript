import van from "vanjs-core";
const { span, button, div } = van.tags;
import { appState, replaceAppState } from "../store";

const createIconButton = (
  icon: HTMLSpanElement,
  onClick: () => void,
  id?: string
) => {
  return button(
    {
      class: "icon-button",
      id: id || undefined,
      onclick: onClick,
    } as Record<string, any>,
    icon
  );
};

function changeView(view: string) {
  const currentView = appState.currentView === view ? "empty" : view;
  
  replaceAppState({currentView})
  // console.info(appState.currentView)
}

const iconEl = (icon: string) => {
  return span({
    class: "icon",
    style: `background-image: url('data:image/svg+xml;utf8,${icon}');`,
  });
};

const infoIcon = iconEl(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
);
const translateIcon = iconEl(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>'
);
const configIcon = iconEl(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'
);
const stopIcon = iconEl(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h12v12H6z"/></svg>'
);

const changeIcon = (icon: HTMLSpanElement) => {
  const shadowRoots = Array.from(document.querySelectorAll("*"))
  .map((el) => el.shadowRoot)
  .filter((root) => root !== null);
shadowRoots.forEach((root) => {
  const button = root.querySelector("#transButton");
  if (button) {
    // Xóa icon cũ
    while (button.firstChild) {
      button.removeChild(button.firstChild);
    }
    // Thêm stop icon mới
    button.appendChild(icon);
  }
});
}

export default () => {
  van.derive(() => {
    if(appState.currentView === "reader"){
      if(appState.isTranslating === true){
        changeIcon(stopIcon)
      }else{
        changeIcon(translateIcon)
      }
    }
  });
  return div(
    { id: "bottom-bar" },
    createIconButton(infoIcon, () => changeView("history")),
    createIconButton(translateIcon, () => changeView("reader"), "transButton"),
    createIconButton(configIcon, () => changeView("settings"))
  );
};
