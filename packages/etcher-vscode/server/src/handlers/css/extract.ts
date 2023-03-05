import { TextDocument } from 'vscode-languageserver-textdocument';

export const extractFromDocument = (document: TextDocument): string => {
    // extract the content of all style tags in the document
    const styles = document.getText().match(/<style[^>]*>([^]*?)<\/style>/g);

    // if there are no styles, return an empty string
    if (!styles) return '';

    return styles.map((style) => style.replace(/<style[^>]*>([^]*?)<\/style>/, '$1')).join('\n');
};
