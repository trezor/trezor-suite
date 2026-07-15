const serializeErrorReplacer = (_key: string, value: unknown): unknown => {
    // Error instances are objects, but have no JSON printable properties.
    // Instead, .toString() is their standard string representation. Though stack trace must be included separately
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/toString
    if (value instanceof Error) {
        return { message: value.toString(), stackTrace: value.stack };
    }

    return value;
};

/**
 * Serialize an error of unknown type to a string.
 */
export const serializeError = (error: unknown): string => {
    // Plain JavaScript object is not a conventional error type, but we have to count with it.
    if (typeof error === 'object') {
        return JSON.stringify(error, serializeErrorReplacer);
    }

    // Assumed to be a primitive type; exotic types such as function will also be simply stringified.
    return `${error}`;
};
