import { PROTOCOL_SCHEME } from '@suite-constants/protocol';

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

export type CoinProtocolInfo = {
    scheme: PROTOCOL_SCHEME.BITCOIN;
    address: string;
    amount?: number;
};

export const getProtocolInfo = (uri: string): CoinProtocolInfo | null => {
    const url = parseUri(uri);
    if (!url) return null;

    const { protocol, pathname, host, search } = url;
    const scheme = protocol.slice(0, -1); // slice ":" from protocol

    const params = parseQuery(search);

    if (scheme === PROTOCOL_SCHEME.BITCOIN) {
        if (!pathname && !host) return null; // address may be in pathname (regular bitcoin:addr) or host (bitcoin://addr)
        const floatAmount = Number.parseFloat(params.amount ?? '');
        const amount = !Number.isNaN(floatAmount) && floatAmount > 0 ? floatAmount : undefined;
        return {
            scheme,
            address: pathname?.replace('//', '') || host,
            amount,
        };
    }

    return null;
};
