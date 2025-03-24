import { define } from "vanjs-element";
import van from "vanjs-core";
import { Await } from "vanjs-ui";
import { HistoryItem } from "../types";
import { db, deleteHistoryItem } from "../cached";

const { div, style, button, a } = van.tags;

const currentHistory = async () => {
    return await db.get(`history:${window.location.href}`) as HistoryItem;
}

const createHistoryItem = (url: string, title: string) => {
  return div(
    { class: "history-item" },
    a(
      {
        href: url,
        class: "history-link",
        onclick: (e: Event) => {
          e.preventDefault();
          window.location.href = url;
        },
      },
      title
    ),
    button(
      {
        onclick: async function(){
            await deleteHistoryItem(url);
            window.location.reload();
        },
        class: "delete-button",
      },
      "❌"
    )
  );
};

define(
  "history-view",
  ({}) => {
    let last20Items = JSON.parse(localStorage.getItem("dichtruyen-ai:history") || "[]") as HistoryItem[];
    last20Items = last20Items.filter(p => p.url !== window.location.href)
    return [
      style(`
        .history-item {
          padding: 0.5em;
          margin: 0.5em 0;
          border-bottom: 1px solid #eee;
        }
        .history-link {
          text-decoration: none;
          color: #333;
          margin-right: 1em;
        }
        .delete-button {
          float: right;
          border: none;
          background: none;
          cursor: pointer;
        }
        .empty-label {
          text-align: center;
          padding: 2em;
          color: #666;
        }
        .history-list {
          max-height: 700px;
          overflow-y: auto;
          border-bottom: 3px solid #333;
        }
      `),
      div(
        { class: 'pure-g' },
        div(
          { class: 'pure-u-1 history-list' },
          last20Items.length === 0 
            ? div({ class: 'empty-label' }, "Lịch sử trống")
            : last20Items.map(item => 
                createHistoryItem(item.url, item.title)
              )
        ),
        Await({
            value: currentHistory(),
            container: div
        }, (data) => data && createHistoryItem(data.url, data.title))
      ),
      
    ];
  },
  false
);
