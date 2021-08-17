import { PROTOCOL_SCHEME } from '@suite-support/Protocol';

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
    amount: number;
}

export const getProtocolInfo = (uri: string): BitcoinProtocol => {
    const { protocol, pathname, search } = new URL(uri.replace('://', ':'));
    const scheme = protocol.slice(0, -1);

    const params: { [key: string]: string } = {};

    new URLSearchParams(search).forEach((v, k) => {
        params[k] = v;
    });

    if (scheme === PROTOCOL_SCHEME.BITCOIN && !Number.isNaN(Number.parseFloat(params.amount))) {
        return {
            scheme,
            address: pathname,
            amount: Number.parseFloat(params.amount),
        };
    }

    throw new Error(
        `Unsupported '${scheme}' protocol handler or its params '${JSON.stringify(params)}'!`,
    );
};
