export const parseExpression = (doc: any, rgx: RegExp) => {
    const res = [];

    let match = rgx.exec(doc);

    while (match != null) {
        res.push(match);

        match = rgx.exec(doc);
    }

    return res;
};

export const parseBetweenPairs = (
    index: number,
    chars: [string, string],
    doc: string
) => {
    let open = 0;
    let close = 0;
    let start = 0;
    let end = 0;

    for (let i = index; i < doc.length; i++) {
        if (chars[0].length > 1) {
            if (doc.substring(i, i + chars[0].length) === chars[0]) {
                if (open === 0) {
                    start = i;
                }
                open++;
            } else if (doc.substring(i, i + chars[1].length) === chars[1]) {
                close++;
                if (open === close) {
                    end = i;
                    break;
                }
            }
            continue;
        }

        if (doc[i] === chars[0]) {
            if (open === 0) {
                start = i;
            }
            open++;
        } else if (doc[i] === chars[1]) {
            close++;
            if (open === close) {
                end = i;
                break;
            }
        }
    }

    return doc.substring(start, end + chars[1].length);
};
