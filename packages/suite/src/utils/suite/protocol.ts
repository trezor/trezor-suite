import { Protocol } from '@suite-common/suite-constants';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { parseQuery, parseUri } from './parseUri';
import { analytics, EventType } from '@trezor/suite-analytics';

export type CoinProtocolInfo = {
    scheme: Protocol;
    address: string;
    amount?: number;
};

const removeLeadingTrailingSlashes = (text: string) => text.replace(/^\/{0,2}|\/$/g, '');

export const getProtocolInfo = (uri: string): CoinProtocolInfo | null => {
    const url = parseUri(uri);

    if (url) {
        const { protocol, pathname, host, search } = url;
        const scheme = protocol.slice(0, -1) as Protocol; // slice ":" from protocol
        const params = parseQuery(search);

        analytics.report({
            type: EventType.AppUriHandler,
            payload: {
                scheme,
                isAmountPresent: params.amount !== undefined,
            },
        });

        if (getNetworkSymbolForProtocol(scheme)) {
            if (!pathname && !host) return null; // address may be in pathname (regular bitcoin:addr) or host (bitcoin://addr)

            const floatAmount = Number.parseFloat(params.amount ?? '');
            const amount = !Number.isNaN(floatAmount) && floatAmount > 0 ? floatAmount : undefined;

            const address =
                removeLeadingTrailingSlashes(pathname) || removeLeadingTrailingSlashes(host);

            return {
                scheme,
                address,
                amount,
            };
        }
    }

    return null;
};
export { getNetworkSymbolForProtocol };
