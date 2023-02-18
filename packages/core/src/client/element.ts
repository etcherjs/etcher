import { wrappedEval } from './constructs';

export default class EtcherElement extends HTMLElement {
    etcher_id: string;

    constructor(template: DocumentFragment, etcher_id: string) {
        super();

        this.etcher_id = etcher_id;

        const shadow = this.attachShadow({
            mode: 'open',
        });

        shadow.appendChild(template);

        this.registerProps();
    }

    async registerProps() {
        // NOTE: Not the best implementation, but works with the current system.

        const moduleExports = await import(/* @vite-ignore */ `/@etcher/${this.etcher_id}.js`);

        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];

            Object.defineProperty(moduleExports.props, attr.name, {
                get: () => attr.value,
                set: (value: any) => {
                    attr.value = value;
                },
            });
        }
    }
}

export const transform = (id: string, body: DocumentFragment) => {
    window.customElements.define(
        id,
        class extends EtcherElement {
            constructor() {
                super(body, id);

                window._$etcherCore.c[id] = this;
            }
        }
    );
};

export class STD_ELEMENT_FOR extends HTMLElement {
    constructor() {
        super();

        const items = wrappedEval(this.getAttribute('items')) || wrappedEval(this.getAttribute('default')) || [];
        const label = this.getAttribute('label') || 'item';

        const shadow = this.attachShadow({
            mode: 'open',
        });

        const template = document.createElement('template');

        template.innerHTML = this.innerHTML;

        const content = template.content;

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < items.length; i++) {
            const clone = document.importNode(content, true);

            const replaceNode = (node: Node) => {
                if (node.textContent) {
                    const text = node.textContent;

                    if (text) {
                        node.textContent = text.replace(new RegExp(`{{([^}]*?)(${label})(.*?)}}`, 'gs'), items[i]);
                    }
                }
            };

            for (let j = 0; j < clone.childNodes.length; j++) {
                const node = clone.childNodes[j];

                replaceNode(node);
            }

            fragment.appendChild(clone);
        }

        shadow.appendChild(fragment);
    }
}

export class STD_ELEMENT_LOOP extends HTMLElement {
    constructor() {
        super();

        const iterations = this.getAttribute('iterations') || this.getAttribute('default');

        const shadow = this.attachShadow({
            mode: 'open',
        });

        const template = document.createElement('template');

        template.innerHTML = this.innerHTML;

        const content = template.content;

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < Number(iterations); i++) {
            const clone = document.importNode(content, true);

            const replaceNode = (node: Node) => {
                if (node.textContent) {
                    const text = node.textContent;

                    if (text) {
                        node.textContent = text.replace(new RegExp(`{{([^}]*index*?)}}`, 'gs'), i.toString());
                    }
                }
            };

            for (let j = 0; j < clone.childNodes.length; j++) {
                const node = clone.childNodes[j];

                replaceNode(node);
            }

            fragment.appendChild(clone);
        }

        shadow.appendChild(fragment);
    }
}

export class STD_ELEMENT_IF extends HTMLElement {
    constructor() {
        super();

        const condition = wrappedEval(this.getAttribute('condition')) || wrappedEval(this.getAttribute('default'));

        const shadow = this.attachShadow({
            mode: 'open',
        });

        const template = document.createElement('template');

        template.innerHTML = this.innerHTML;

        const content = template.content;

        const fragment = document.createDocumentFragment();

        if (condition) {
            const clone = document.importNode(content, true);

            fragment.appendChild(clone);
        }

        shadow.appendChild(fragment);
    }
}
