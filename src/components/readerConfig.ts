import van from "vanjs-core";
import { Modal } from "vanjs-ui";
import { appState, settingsState, replaceAppState, replaceReaderState } from "../store";
const { p, div, button, select, option, label, input } = van.tags;
const FONTS = [
    {name: "System ui", value: "system-ui"},
    {name: "Times New Roman", value: "Times New Roman"},
    {name: "Arial", value: "Arial"},
    {name: "Verdana", value: "Verdana"},
    {name: "Tahoma", value: "Tahoma"},
    {name: "Segoe UI", value: "Segoe UI"},
]
const COLORS = [
    {
      name: "Light Gray",
      value: "#F4F4F4",
    },
    {
      name: "Light Blue",
      value: "#E8EBEE",
    },
    {
      name: "Deep Blue",
      value: "#E1E4F2",
    },
    {
      name: "Light Yellow",
      value: "#F4F4E3",
    },
    {
      name: "Sepia",
      value: "#EAE4D3",
    },
    {
      name: "Deep Yellow",
      value: "#FAFAC8",
    },
    {
      name: "Dark",
      value: "black",
    },
  ];
const LINE_HEIGHTS = ["1.6", "1", "1.2", "1.4", "1.8", "2"];

const openCloseModal = (display: string = "none") => {
    const shadowRoots = Array.from(document.querySelectorAll("*"))
  .map((el) => el.shadowRoot)
  .filter((root) => root !== null);
  shadowRoots.forEach(root => {
    const mld = root.getElementById("mdlReaderContainer") as HTMLElement
    if(mld){
        // console.log(mld)
        mld.style.display = display;
    }
  })
}


const mdlState = van.derive(() => settingsState.readerView)
  van.derive(() => {
    if(appState.openReaderConfig === true){
        openCloseModal("flex")
    }else{
        openCloseModal("none")
    }
    // mdlState.val = settingsState.readerView;
    // console.log(mdlState.val)
  })

export default function () {
  const closed = van.state(false);
  
  return div({id: "mdlReaderContainer", style: "display: none"},
    Modal(
        { closed },
        div({class: "pure-g"}, 
            // Font Family
            div({class: "pure-u-1 pure-u-md-1-2 p-1"},
                p("Font Family"),
                select({
                    class: "pure-input-1",
                    onchange: (e) => {
                        replaceReaderState({fontFamily: e.target.value})
                    }
                },
                    FONTS.map(font => 
                        option({
                            value: font.value, 
                            selected: () => mdlState.val.fontFamily === font.value
                        }, font.name)
                    )
                )
            ),
            // Font Size
            div({class: "pure-u-1 pure-u-md-1-2 p-1"},
                p("Font Size"),
                select({
                    class: "pure-input-1",
                    onchange: (e) => {
                        replaceReaderState({fontSize: e.target.value})
                    }
                },
                    Array.from({length: 15}, (_, i) => i + 16).map(size => 
                        option({
                            value: size, 
                            selected: () => Number(mdlState.val.fontSize) === size
                        }, `${size}px`)
                    )
                )
            ),
            // Background Color
            div({class: "pure-u-1 pure-u-md-1-2 p-1"},
                p("Background Color"),
                select({
                    class: "pure-input-1",
                    onchange: (e) => {
                        replaceReaderState({backgroundColor: e.target.value})
                    }
                },
                    COLORS.map(color => 
                        option({
                            value: color.value,
                            selected: () => mdlState.val.backgroundColor === color.value
                        }, color.name)
                    )
                )
            ),
            // Line Height
            div({class: "pure-u-1 pure-u-md-1-2 p-1"},
                p("Line Height"),
                select({
                    class: "pure-input-1",
                    onchange: (e) => {
                        replaceReaderState({lineHeight: e.target.value})
                    }
                },
                    LINE_HEIGHTS.map(height => 
                        option({
                            value: height,
                            selected: () => mdlState.val.lineHeight === height
                        }, height)
                    )
                )
            ),
            // Bionic Reading
            div({class: "pure-u-1 p-1", style: "margin: 5px 0px;"},
                label({class: "pure-checkbox"},
                    input({
                        type: "checkbox",
                        checked: mdlState.val.bionicReading,
                        onchange: (e) => {
                            replaceReaderState({bionicReading: e.target.checked})
                        }
                    }),
                    " Fast Reader"
                )
            )
        ),
        div(
          { style: "display: flex; justify-content: center;" },
          button(
            { onclick: () => replaceAppState({ openReaderConfig: false }) },
            "Ok"
          ),
        )
      )
  )
}

