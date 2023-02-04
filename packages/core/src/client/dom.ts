type DOMElement = {
    element: Element | HTMLElement;
    attributes: { [key: string]: string };
    tag: string;
    content: string;
    contentLength: number;
    indexRange: [number, number];
    children: DOMElement[];
    selector: string;
};

export const html = (body: string): HTMLCollection => {
    const div = document.createElement('div');
    div.setAttribute('_etcher_root_', 'true');

    div.innerHTML = body;

    return div.children;
};

export const replace = (element: Element | HTMLElement, find: string, replace: string): Element | HTMLElement => {
    const html = element.innerHTML;

    element.innerHTML = html.replace(find, replace);

    return element;
};

export const map = (body: string, orignalBody?: string): DOMElement[] => {
    const collection = html(body);

    let index = 0;

    return Array.from(collection).map((element, i) => {
        let selector = ``;

        index = (orignalBody ? orignalBody : body).indexOf(element.outerHTML, index);

        const attributes: { [key: string]: string } = {};

        for (const attribute of element.attributes) {
            attributes[attribute.name] = attribute.value;
        }

        const tag = element.tagName.toLowerCase();

        const content = element.innerHTML;

        const contentLength = content.length;
        const indexRange: [number, number] = [index, index + element.outerHTML.length];

        index += element.outerHTML.split(element.innerHTML)[0].length;
        index += contentLength;
        index += element.outerHTML.split(element.innerHTML)[1].length;

        const children = element.children.length ? map(element.innerHTML, orignalBody ? orignalBody : body) : [];

        selector += tag;

        if (attributes.id) selector += `#${attributes.id}`;
        if (attributes.class) selector += `.${attributes.class}`;

        return {
            element,
            attributes,
            tag,
            content,
            contentLength,
            indexRange,
            children,
            selector,
        };
    });
};

export const parent = (body: string, stringIndex: number): Element | null => {
    const dom = map(body);

    const children = (ele: DOMElement): boolean => {
        const val = ele.children.some((child) => {
            const [start, end] = child.indexRange;

            if (stringIndex >= start && stringIndex <= end) {
                return true;
            }

            if (child.children.length) {
                return children(child);
            }
        });

        return val;
    };

    const find = (dom: DOMElement[], stringIndex: number): DOMElement | null => {
        for (const element of dom) {
            const [start, end] = element.indexRange;

            if (stringIndex >= start && stringIndex <= end) {
                if (element.children.length) {
                    if (children(element)) {
                        return find(element.children, stringIndex);
                    } else {
                        return element;
                    }
                } else {
                    return element;
                }
            }
        }

        return null;
    };

    const element = find(dom, stringIndex);

    return element ? element.element : null;
};

export const selector = (tree: DOMElement[], element: Element | HTMLElement): string => {
    let path = ``;

    const isElement = (ele: DOMElement): boolean => {
        const tags = ele.element.tagName === element.tagName;
        const classes = ele.element.className === element.className;
        const ids = ele.element.id === element.id;
        const innerHTML = ele.element.innerHTML === element.innerHTML;

        return tags && classes && ids && innerHTML;
    };

    const find = (tree: DOMElement[], element: Element | HTMLElement): DOMElement | null => {
        for (const ele of tree) {
            if (isElement(ele)) {
                return ele;
            }

            if (ele.children.length) {
                const child = find(ele.children, element);

                if (child) {
                    return child;
                }
            }
        }

        return null;
    };

    const elementPath = find(tree, element);

    if (elementPath) {
        const { selector } = elementPath;

        path += selector;
    }

    return path;
};
