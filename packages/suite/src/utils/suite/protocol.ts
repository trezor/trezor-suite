import { PROTOCOL_SCHEME } from 'src/constants/suite/protocol';
import { parseQuery, parseUri } from './parseUri';
import { analytics, EventType } from '@trezor/suite-analytics';

export type CoinProtocolInfo = {
    scheme: PROTOCOL_SCHEME;
    address: string;
    amount?: number;
};

export const isProtocolScheme = (scheme: string): scheme is PROTOCOL_SCHEME =>
    Object.values(PROTOCOL_SCHEME).includes(scheme as PROTOCOL_SCHEME);

export const getProtocolInfo = (uri: string): CoinProtocolInfo | null => {
    const url = parseUri(uri);

    if (url) {
        const { protocol, pathname, host, search } = url;
        const scheme = protocol.slice(0, -1); // slice ":" from protocol
        const params = parseQuery(search);

        analytics.report({
            type: EventType.AppUriHandler,
            payload: {
                scheme,
                isAmountPresent: params.amount !== undefined,
            },
        });

        if (isProtocolScheme(scheme)) {
            if (!pathname && !host) return null; // address may be in pathname (regular bitcoin:addr) or host (bitcoin://addr)

            const floatAmount = Number.parseFloat(params.amount ?? '');
            const amount = !Number.isNaN(floatAmount) && floatAmount > 0 ? floatAmount : undefined;

            return {
                scheme,
                address: pathname?.replace('//', '') || host,
                amount,
            };
        }
    }

    return null;
};
