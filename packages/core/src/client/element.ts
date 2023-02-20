import { wrappedEval } from './constructs';

const CONSTRUCTOR_INDEXES = new Map<string, number>();

export default class EtcherElement extends HTMLElement {
    etcher_id: string;

    constructor(template: (index: number) => DocumentFragment, etcher_id: string) {
        super();

        CONSTRUCTOR_INDEXES.set(etcher_id, (CONSTRUCTOR_INDEXES.get(etcher_id) || 0) + 1);

        this.etcher_id = etcher_id;

        const shadow = this.attachShadow({
            mode: 'open',
        });

        shadow.appendChild(template(CONSTRUCTOR_INDEXES.get(etcher_id) || 0));

        this.registerProps();
    }

    async registerProps() {
        // NOTE: Not the best implementation, but works with the current system.

        const index = CONSTRUCTOR_INDEXES.get(this.etcher_id);

        const moduleExports = await import(/* @vite-ignore */ `/@etcher/${this.etcher_id}.js`);

        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];

            if (!moduleExports.props[index]) moduleExports.props[index] = {};

            Object.defineProperty(moduleExports.props[index], attr.name, {
                get: () => attr.value,
                set: (value: any) => {
                    attr.value = value;
                },
            });
        }
    }
}

export const transform = (id: string, body: () => DocumentFragment) => {
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
    __items: any[];
    __label: string;
    constructor() {
        super();

        const items = wrappedEval(this.getAttribute('items')) || wrappedEval(this.getAttribute('default')) || [];
        const label = this.getAttribute('label') || 'item';

        this.__items = items;
        this.__label = label;
    }

    connectedCallback() {
        const template = document.createElement('template');

        template.innerHTML = this.innerHTML;

        this.innerHTML = '';

        const content = template.content;

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < this.__items.length; i++) {
            const clone = document.importNode(content, true);

            const replaceNode = (node: Node) => {
                if (node.textContent) {
                    const text = node.textContent;

                    if (text) {
                        node.textContent = text.replace(
                            new RegExp(`{{([^}]*?)(${this.__label})(.*?)}}`, 'gs'),
                            this.__items[i]
                        );
                    }
                }
            };

            for (let j = 0; j < clone.childNodes.length; j++) {
                const node = clone.childNodes[j];

                replaceNode(node);
            }

            fragment.appendChild(clone);
        }

        this.appendChild(fragment.cloneNode(true));
    }
}

export class STD_ELEMENT_LOOP extends HTMLElement {
    __iterations: number;
    constructor() {
        super();

        const iterations = this.getAttribute('iterations') || this.getAttribute('default');

        this.__iterations = Number(iterations);
    }

    connectedCallback() {
        const template = document.createElement('template');

        template.innerHTML = this.innerHTML;

        this.innerHTML = '';

        const content = template.content;

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < this.__iterations; i++) {
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

        this.appendChild(fragment.cloneNode(true));
    }
}

export class STD_ELEMENT_IF extends HTMLElement {
    __condition: boolean;
    constructor() {
        super();

        const condition = wrappedEval(this.getAttribute('condition')) || wrappedEval(this.getAttribute('default'));

        this.__condition = Boolean(condition);
    }

    connectedCallback() {
        const template = document.createElement('template');

        template.innerHTML = this.innerHTML;

        this.innerHTML = '';

        const content = template.content;

        const fragment = document.createDocumentFragment();

        if (this.__condition) {
            const clone = document.importNode(content, true);

            fragment.appendChild(clone);
        }

        this.appendChild(fragment);
    }
}
