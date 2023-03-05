import EtcherElement, { STD_ELEMENT_FOR, STD_ELEMENT_IF, STD_ELEMENT_LOOP, transform } from './element';
import { template, listen, insert, onMount } from './dom';
import { createSignal } from './constructs';

declare global {
    interface Window {
        _$etcherCore: {
            c: Record<string, any>;

            template: (id: string, body: string) => DocumentFragment;
            transform: (
                id: string,
                body: () => [DocumentFragment, ...(($: ShadowRoot) => void)[]],
                ...mountCallbacks: (() => void)[]
            ) => void;
            listen: (id: string, element: Element, callback: (event: Event) => void, event: string) => void;
            insert: (id: string, element: Element, template: DocumentFragment, content: () => any) => void;

            web: {
                createSignal: typeof createSignal;
            };
        };
        etcher: {
            createSignal: typeof createSignal;
            onMount: typeof onMount;
        };
    }
}

window._$etcherCore = {
    c: {},

    transform,
    template,
    listen,
    insert,

    web: {
        createSignal,
    },
};

window.etcher = {
    createSignal,
    onMount,
};

window.customElements.define('etcher-std-if', STD_ELEMENT_IF);
window.customElements.define('etcher-std-for', STD_ELEMENT_FOR);
window.customElements.define('etcher-std-loop', STD_ELEMENT_LOOP);

export default {
    Element: EtcherElement,

    transform,
    template,
    listen,
    insert,

    createSignal,
};
