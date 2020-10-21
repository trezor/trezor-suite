// copy paste from my trezor (old wallet) https://github.com/satoshilabs/mytrezor/blob/app/components/address-input/address-input.js
// TODO: consider to move this somewhere else (router utils?)

export interface ParsedURI {
    address: string;
    amount?: string;
}
interface Params {
    [key: string]: string;
}

const stripPrefix = (str: string) => {
    if (!str.match(':')) {
        return str;
    }
    const parts = str.split(':');
    parts.shift();
    return parts.join('');
};

// Parse URL query string (like 'foo=bar&baz=1337) into an object
const parseQuery = (str: string) => {
    const params: Params = {};
    return str
        .split('&')
        .map(val => val.split('='))
        .reduce((values, pair) => {
            if (pair.length > 1) {
                // eslint-disable-next-line prefer-destructuring
                values[pair[0]] = pair[1];
            }
            return values;
        }, params);
};

// Parse a string read from a bitcoin QR code into an object
export const parseUri = (uri: string): ParsedURI => {
    const str = stripPrefix(uri);
    const query = str.split('?');
    const values = query.length > 1 ? parseQuery(query[1]) : {};
    return {
        address: query[0],
        ...values,
    };
};
