export const html = (body: string): HTMLCollection => {
    const template = document.createElement('template');

    template.innerHTML = body;

    return template.content.children;
};

export const replace = (element: Element | HTMLElement, find: string, replace: string): Element | HTMLElement => {
    const html = element.innerHTML;

    const index = html.indexOf(find);

    if (index < 0) return;

    element.innerHTML = html.substring(0, index) + replace + html.substring(index + find.length);

    return element;
};

export const closest = (body: string, stringIndex: number): Element | null => {
    const htmlCollection = html(body);

    if (htmlCollection.length < 0) return;

    let leftIndex = body.lastIndexOf('<', stringIndex);
    let rightIndex = body.indexOf('>', leftIndex);

    if (body[leftIndex + 1] === '!') {
        leftIndex = body.lastIndexOf('<', leftIndex - 1);
        rightIndex = body.indexOf('>', leftIndex);
    }

    const tag = body.substring(leftIndex + 1, rightIndex).split(' ')[0];

    const validate = (collection: HTMLCollection) => {
        for (let i = 0; i < collection.length; i++) {
            const element = collection[i];

            if (element.tagName.toLowerCase() !== tag.replace('/', '')) continue;

            if (
                !body.slice(0, leftIndex).endsWith(element.innerHTML) &&
                !body.slice(rightIndex + 1, -1).startsWith(element.innerHTML)
            )
                continue;

            return element;
        }

        for (let i = 0; i < collection.length; i++) {
            const element = collection[i];

            if (element.children.length > 0) {
                const result = validate(element.children);

                if (result) return result;
            }
        }
    };

    return validate(htmlCollection);
};

export const selector = (element: Element | HTMLElement): string => {
    let path = ``;

    while (element) {
        const tag = element.tagName.toLowerCase();

        const id = element.id ? `#${element.id}` : ``;

        const classes = element.className
            ? `.${element.className
                  .split(' ')
                  .filter((c) => c)
                  .join('.')}`
            : ``;

        const selector = `${tag}${id}${classes}`;

        if (element.parentElement && element.parentElement?.children?.length !== 1) {
            const index = Array.from(element.parentElement.children).indexOf(element);

            path = path ? `${selector}:nth-child(${index + 1}) > ${path}` : `${selector}:nth-child(${index + 1})`;
        } else {
            path = path ? `${selector} > ${path}` : selector;
        }

        element = element.parentElement;
    }

    return path;
};
