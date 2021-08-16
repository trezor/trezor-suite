/* eslint-disable prefer-destructuring */
export interface ParsedURI {
    address: string;
    amount?: string;
}

const stripPrefix = (str: string): string => {
    if (!str.match(':')) {
        return str;
    }
    const parts = str.split(':');
    parts.shift();
    return parts.join('');
};

// Parse URL query string (like 'foo=bar&baz=1337) into an object
export const parseQuery = (str: string) =>
    str
        .split('&')
        .map(val => val.split('='))
        .reduce((vals: { [key: string]: any }, pair: string[]) => {
            if (pair.length > 1) {
                vals[pair[0]] = pair[1];
            }
            return vals;
        }, {});

// Parse a string read from a bitcoin QR code into an object
export const parseUri = (uri: string): ParsedURI => {
    const str = stripPrefix(uri);
    const query: string[] = str.split('?');
    const values: Record<string, any> = query.length > 1 ? parseQuery(query[1]) : {};
    const address = query[0] || '';

    return {
        ...values,
        address,
    };
};


