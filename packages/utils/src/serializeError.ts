/**
 * Serialize an error of unknown type to a string.
 */
export const serializeError = (error: unknown): string => {
    // Error instances are objects, but have no JSON printable properties
    if (error instanceof Error) {
        return error.toString();
    }
    if (typeof error === 'object') {
        return JSON.stringify(error);
    }

    // assumed to be a primitive type; exotic types such as function will also be simply stringified
    return `${error}`;
};
