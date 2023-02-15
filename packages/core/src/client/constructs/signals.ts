import { insert } from '../dom';

export const wrappedEval = (code: string) => {
    return new Function('return ' + code)();
};

export const createSignal = <T>(value: T): [(node?: string) => T, (value: T) => void, (node: string) => void] => {
    let currentValue = value;
    let accessors: string[] = [];

    const signal = (node?: string) => {
        if (node) {
            accessors.push(node);

            insert('ETCHER-SIGNAL', wrappedEval(node), null, () => currentValue);
        }

        return currentValue;
    };

    const setSignal = (value: T) => {
        currentValue = value;

        for (let i = 0; i < accessors.length; i++) {
            const node = accessors[i];

            insert('ETCHER-SIGNAL', wrappedEval(node), null, () => currentValue);
        }
    };

    const accessor = (node: string) => {
        accessors.push(node);
    };

    return [signal, setSignal, accessor];
};
