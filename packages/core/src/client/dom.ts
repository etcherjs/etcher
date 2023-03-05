import { transform } from './element';
import { error, warn } from './log';

export const onMount = (callback: () => void) => {
    return callback;
};

export const template = (id: string, body: string): DocumentFragment => {
    try {
        const template = document.createElement('template');
        template.innerHTML = body;

        return template.content;
    } catch (e) {
        error(`Error parsing template: `, e);
        renderError(id, e);
    }
};

export const listen = (id: string, node: Element, callback: (event: Event) => void, event: string) => {
    try {
        node[`$$${event}`] = callback;
        node.addEventListener(event, callback);
    } catch (e) {
        error(`Error listening to event: `, e);
        renderError(id, e);
    }
};

export const insert = (
    id: string,
    node: Element,
    template: DocumentFragment,
    content: any,
    dependencies?: any[] | string
) => {
    try {
        if (!node) return;

        const addingAttribute = typeof dependencies === 'string';

        let insertContent = content;

        try {
            typeof content === 'function' && (insertContent = content());
        } catch (e) {
            node.replaceWith(`{{${content}}}`);
            return warn(
                `Error evaluating interpolated expression:\n\n{{${String(content).replace(
                    '() => ',
                    ''
                )}}}\n  ${'^'.repeat(String(content).replace('() => ', '').length)}\n\n${e.message}`
            );
        }

        Array.isArray(insertContent) && (insertContent = insertContent[0]);

        if (dependencies && !addingAttribute) {
            for (let i = 0; i < dependencies.length; i++) {
                if (!dependencies[i]) dependencies[i] = {};

                if (dependencies[i].$$$interval) {
                    return;
                }

                const interval = () => {
                    const newContent = content();

                    if (newContent !== insertContent) {
                        insert('ETCHER-DEPENDENCY', node, template, content);

                        insertContent = newContent;
                    }
                };

                dependencies[i].$$$interval = window.setInterval(interval, 100);
            }
        }

        if (typeof insertContent === 'undefined') return;

        if (addingAttribute) {
            let colonSeparated = [];

            if (!(node instanceof HTMLElement)) return;

            colonSeparated = dependencies.split(':');

            if (colonSeparated.length > 1) {
                switch (colonSeparated[0]) {
                    case 'style': {
                        node.style[colonSeparated[1]] = insertContent;
                        break;
                    }
                    default: {
                        error(`Unknown attribute type: ${colonSeparated[0]}`);
                        break;
                    }
                }

                return;
            }

            node.setAttribute(dependencies, insertContent);

            return;
        }

        node.replaceWith(insertContent);
    } catch (e) {
        error(`Error inserting interpolated expression: `, e);
        renderError(id, e);
    }
};

export const renderError = (id: string, error: Error) => {
    const markup = `<div style="color: #ff4c4c; font-family: monospace; font-size: 14px; padding: 20px; background: #aaaaaa1c; border: 2px solid #e5e5e570; border-radius: 5px; margin: 10px 0; max-width: 900px;">
        <span style="white-space: break-spaces;">Error while rendering component: ${error.message}</span>
        <br />
        <br />
        <div style="font-size: 12px; color: #8a8989; font-family: monospace; whitespace: pre-wrap;">
            ${error.stack.split('\n').join('<br />')}
        </div>
        </div>`;

    const temp = template(id, markup);

    transform(id, () => [temp]);
};
