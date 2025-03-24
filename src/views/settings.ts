import { define } from "vanjs-element";
import van from "vanjs-core";
import { Tabs} from "vanjs-ui";
import PromptTab from "../components/promptTab";
import AiProviderTab from "../components/aiProviderTab";

const { div, style } = van.tags;

define("settings-view", () => {
    return [
        style(`
            .tbbt.active{
                background-color:rgba(58, 119, 224, 0.88) !important;
            }
        `),
        div({id: "settings-container"},
            Tabs({
                style: "max-width: 500px;",
                tabButtonBorderStyle: "none",
                tabButtonClass: "tbbt",
                tabButtonRowColor: "none",
                tabButtonRowStyleOverrides: {
                    "padding-left": "12px",
                },
              },
              {
                Prompt: PromptTab(),
                AI: AiProviderTab
              }
            )
        )
    ]
}, false)