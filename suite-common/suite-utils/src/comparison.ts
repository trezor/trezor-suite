export const isChanged = (prev?: any, current?: any, filter?: { [k: string]: string[] }) => {
    // 1. both objects are the same (solves simple types like string, boolean and number)
    if (prev === current) return false;
    // 2. one of the objects is null/undefined
    if (!prev || !current) return true;

    const prevType = Object.prototype.toString.call(prev);
    const currentType = Object.prototype.toString.call(current);
    // 3. one of the objects has different type then other
    if (prevType !== currentType) return true;

    if (currentType === '[object Array]') {
        // 4. Array length is different
        if (prev.length !== current.length) return true;
        // observe array recursive
        for (let i = 0; i < current.length; i++) {
            if (isChanged(prev[i], current[i], filter)) return true;
        }
    } else if (currentType === '[object Object]') {
        const prevKeys = Object.keys(prev);
        const currentKeys = Object.keys(current);
        // 5. simple validation of keys length
        if (prevKeys.length !== currentKeys.length) return true;

        // 6. "prev" has keys which "current" doesn't have
        const prevDifference = prevKeys.find(k => currentKeys.indexOf(k) < 0);
        if (prevDifference) return true;

        // 8. observe every key recursive
        for (let i = 0; i < currentKeys.length; i++) {
            const key = currentKeys[i];

            if (filter && filter.hasOwnProperty(key) && prev[key] && current[key]) {
                const prevFiltered = {};
                const currentFiltered = {};
                for (let i2 = 0; i2 < filter[key].length; i2++) {
                    const field = filter[key][i2];
                    // @ts-expect-error
                    prevFiltered[field] = prev[key][field];
                    // @ts-expect-error
                    currentFiltered[field] = current[key][field];
                }
                if (isChanged(prevFiltered, currentFiltered)) return true;
            } else if (isChanged(prev[key], current[key])) {
                return true;
            }
        }
    } else if (prev !== current) {
        // solve simple types like string, boolean and number
        return true;
    }

    return false;
};
