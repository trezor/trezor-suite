// Parse URL query string (like 'foo=bar&baz=1337) into an object
export const parseQuery = (uri: string) => {
    const params: Record<string, string | undefined> = {};
    try {
        const index = uri.indexOf('?');
        new URLSearchParams(uri.substring(index)).forEach((v, k) => {
            params[k] = v;
        });
    } catch (e) {
        // empty
    }

    return params;
};

export const parseUri = (uri: string) => {
    try {
        return new URL(uri);
    } catch (e) {
        // empty
    }
};
