/**
 * Serialize an error of unknown type to a string.
 */
export const serializeError = (error: unknown): string => {
    // Error instances are objects, but have no JSON printable properties.
    // Instead, .toString() is their standard string representation. Though stack trace must be included separately
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/toString
    if (error instanceof Error) {
        return JSON.stringify({ message: error.toString(), stackTrace: error.stack });
    }

    // plain javascript object is not a conventional error type, but we have to count with it
    if (typeof error === 'object') {
        return JSON.stringify(error);
    }

    // assumed to be a primitive type; exotic types such as function will also be simply stringified
    return `${error}`;
};
