export const formatVariableName = (name: string) => {
    return name.replace(/\W/g, '_');
};

export const replaceEntities = (str: string) => {
    str = str.replaceAll('&quot;', '"');
    str = str.replaceAll('&apos;', "'");
    str = str.replaceAll('&lt;', '<');
    str = str.replaceAll('&gt;', '>');
    str = str.replaceAll('&amp;', '&');
    str = str.replaceAll('&grave;', '`');

    return str;
};

export const wrappedEval = (
    expression: string,
    arg?: any,
    namedArg?: string,
    prepend?: string
) => {
    if (arg && !namedArg) {
        return Function(
            `"use strict"\n${prepend || ''}\n;return (${expression})`
        )(arg);
    }
    if (arg && namedArg) {
        return new Function(
            namedArg,
            `"use strict"\n${prepend || ''}\n;return (${expression})`
        )(arg);
    }
    return Function(
        `"use strict";\n${prepend || ''}\nreturn (${expression})`
    )();
};

export const startsWith = (str: string, regex: RegExp, offset = 0) => {
    const rgx = new RegExp(`^.{${offset}}(${regex.source})`);
    const result = str.match(rgx);
    return !!result;
};

export const parseJSON = (obj: string) => {
    obj = obj.replace(/,(?=\s*})/, '');
    obj = obj.replace(/'/g, '"');
    obj = obj.replace(/([a-zA-Z0-9_]+):/g, '"$1":');

    return JSON.parse(obj);
};

export const loopMatches = (
    iterator: any[],
    callback: (match: any, index: number) => void
) => {
    for (let i = 0; i < iterator.length; i++) {
        callback(iterator[i], i);
    }
};
