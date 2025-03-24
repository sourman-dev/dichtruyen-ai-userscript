import van from "vanjs-core";
import { findPrevNextChapterLinks } from "../utils";
import { replaceAppState } from "../store";
const { div, button, span } = van.tags;


export const render = () => {
  const links = findPrevNextChapterLinks();
  const container = div({
    class: "config-chapter-link",
    style:
      "display: none; justify-content: center; align-items: center; margin: 5px 0; gap: 10px;",
  });
  if (!links.previous && !links.next) {
    container.appendChild(configButton());
  } else {
    container.appendChild(chapterButton("<", links.previous));
    container.appendChild(configButton());
    container.appendChild(chapterButton(">", links.next));
  }

  return container;
};

export const visbile = () => {
  // Find all shadow roots in the document
  const shadowRoots = Array.from(document.querySelectorAll("*"))
    .map((el) => el.shadowRoot)
    .filter((root) => root !== null);

  // Search for elements in each shadow root
  shadowRoots.forEach((root) => {
    root?.querySelectorAll(".config-chapter-link").forEach((el) => {
      (el as HTMLElement).style.display = "flex";
    });
  });
};

const configButton = () => {
  const configIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
  const icon = span({
    class: "icon",
    style: `background-image: url('data:image/svg+xml;utf8,${configIcon}'); width: 20px; height: 20px; display: block; background-size: contain;`,
  });
  return button(
    {
        onclick: () => replaceAppState({openReaderConfig: true}),
      style:
        "height: 30px; min-width: 30px; display: flex; align-items: center; justify-content: center;",
    },
    icon
  );
};

const chapterButton = (lbl: string, link: string | null) => {
  return button(
    {
      disable: !link,
      onclick: () => link && (window.location.href = link),
      style:
        "height: 30px; min-width: 30px; display: flex; align-items: center; justify-content: center;",
    },
    lbl
  );
};
