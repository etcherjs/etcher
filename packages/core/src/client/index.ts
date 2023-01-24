import { createElement, EtcherElement } from './transform';

declare global {
    interface Window {
        _$etcherCore: {
            c: Record<string, any>;
            l: Record<string, any>;
        };
        etcher: {
            Element: typeof EtcherElement;
            transform: (body: string, name: string) => void;
        };
    }
}

window._$etcherCore = {
    c: {},
    l: {},
};

const transform = (body: string, name: string) => {
    window.customElements.define(name, createElement(body, name));
};

window.etcher = {
    transform: transform,
    Element: EtcherElement,
};

Object.freeze(window.etcher);

export default {
    transform: transform,
    Element: EtcherElement,
};
