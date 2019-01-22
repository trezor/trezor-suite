/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* @flow */

// copy paste from mytrezor (old wallet) https://github.com/satoshilabs/mytrezor/blob/87f8a8d9ca82a27b3941c5ec0f399079903f2bfd/app/components/address-input/address-input.js

export type parsedURI = {
    address: string,
    amount: ?string,
};

// Parse a string read from a bitcoin QR code into an object
export const parseUri = (uri: string): ?parsedURI => {
    const str = stripPrefix(uri);
    const query: Array<string> = str.split('?');
    const values: Object = (query.length > 1) ? parseQuery(query[1]) : {};
    values.address = query[0];

    return values;
};

const stripPrefix = (str: string): string => {
    if (!str.match(':')) {
        return str;
    }
    const parts = str.split(':');
    parts.shift();
    return parts.join('');
};

// Parse URL query string (like 'foo=bar&baz=1337) into an object
const parseQuery = (str: string): {} => str.split('&')
    .map(val => val.split('='))
    .reduce((vals, pair) => {
        if (pair.length > 1) {
            vals[pair[0]] = pair[1];
        }
        return vals;
    }, {});
