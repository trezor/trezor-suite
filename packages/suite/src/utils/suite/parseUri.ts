import { PROTOCOL_SCHEME } from '@suite-constants/protocol';

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

interface BaseProtocol {
    scheme: string;
    address: string;
}

interface BitcoinProtocol extends BaseProtocol {
    scheme: PROTOCOL_SCHEME;
    amount?: number;
}

export const getProtocolInfo = (uri: string): BitcoinProtocol | null => {
    const { protocol, pathname, search } = new URL(uri.replace('://', ':'));
    const scheme = protocol.slice(0, -1);

    const params: { [key: string]: string } = {};

    new URLSearchParams(search).forEach((v, k) => {
        params[k] = v;
    });

    const floatAmount = Number.parseFloat(params.amount);
    const amount = !Number.isNaN(floatAmount) && floatAmount > 0 ? floatAmount : undefined;

    if (scheme === PROTOCOL_SCHEME.BITCOIN && pathname) {
        return {
            scheme,
            address: pathname,
            amount,
        };
    }

    return null;
};
