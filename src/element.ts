import van from "vanjs-core";
import { State, ChildDom } from "vanjs-core";

export type ElementProps = {
  /** Get the value of an attribute */
  attr: (name: string, defaultValue?: string | number) => State<string>;
  /** Registers a callback that is called when the element connects to the DOM */
  mount: (
    /** Callback when the element connects to the DOM
     * @returns An optional dismount callback
     */
    mount: () => (() => void) | void
  ) => void;
  /** Instance of the custom element */
  $this: HTMLElement;
};

type ShadowRootInit = {
  mode: "open" | "closed";
};

function define(
  name: string,
  element: (props: ElementProps) => ChildDom,
  options: ShadowRootInit | false = { mode: "open" }
) {
  window.customElements.define(
    name,
    class extends HTMLElement {
      private a: Record<string, State<string>> = {};
      private d?: () => void;

      constructor() {
        super();
      }

      setAttribute(name: string, value: string): void {
        super.setAttribute(name, value);
        this.a[name] && (this.a[name].val = value);
      }

      connectedCallback(): void {
        let mount: (() => (() => void) | void) | undefined;
        van.add(
          options && typeof options === "object" ? (this.attachShadow(options) as unknown as Element) : this,
          element({
            attr: (i: string, v?: string | number) =>
              (this.a[i] ??= van.state(String(this.getAttribute(i) ?? v ?? ""))),
            mount: (newMount: () => (() => void) | void) => {
              let currentMount = mount;
              mount = () => {
                const currentDismount = currentMount?.();
                const newDismount = newMount();
                return () => {
                  currentDismount?.();
                  newDismount?.();
                };
              };
            },
            $this: this,
          })
        );
        const result = mount?.();
        this.d = typeof result === "function" ? result : undefined;
      }

      disconnectedCallback(): void {
        this.d?.();
      }
    }
  );
}

export { define };