import { PROTOCOL_SCHEME } from '@suite-constants/protocol';
import { isNetworkSymbol } from '@wallet-utils/accountUtils';
import type { Network } from '@wallet-types';

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

export type AoppProtocolInfo = {
    scheme: PROTOCOL_SCHEME.AOPP;
    msg: string;
    asset: Network['symbol'];
    v?: string;
    format?: string;
    callback?: string;
};

export const getProtocolInfo = (uri: string): CoinProtocolInfo | AoppProtocolInfo | null => {
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

    if (scheme === PROTOCOL_SCHEME.AOPP) {
        if (!params.msg) return null;
        if (!params.asset || !isNetworkSymbol(params.asset)) return null;
        const validCallback = parseUri(params.callback ?? '');
        return {
            scheme,
            v: params.v,
            asset: params.asset,
            format: params.format,
            msg: params.msg,
            callback: validCallback ? params.callback : undefined,
        };
    }

    return null;
};
