import { getHDPath } from './getHDPath';

const getPathParts = (path: string) => {
    const result = getHDPath(path);

    return result.success ? result.payload : undefined;
};

export const comparePath = (firstPath: string, secondPath: string) => {
    const firstPathParts = getPathParts(firstPath);
    const secondPathParts = getPathParts(secondPath);

    if (!firstPathParts && !secondPathParts) {
        return 0;
    }

    if (!firstPathParts) {
        return 1;
    }

    if (!secondPathParts) {
        return -1;
    }

    const pathLength = Math.max(firstPathParts.length, secondPathParts.length);

    for (let index = 0; index < pathLength; index++) {
        const firstPathPart = firstPathParts[index] ?? -1;
        const secondPathPart = secondPathParts[index] ?? -1;

        if (firstPathPart !== secondPathPart) {
            return firstPathPart - secondPathPart;
        }
    }

    return 0;
};
