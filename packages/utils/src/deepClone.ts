export const deepClone = <T>(value: T): T => {
    if (value === undefined) {
        return value;
    }

    let clone;

    if (typeof structuredClone === 'function') {
        clone = structuredClone(value);
    } else {
        clone = JSON.parse(JSON.stringify(value));
    }

    return clone;
};
