import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkSignVerify } from './NetworkSignVerify';

export const createNetworkSignVerify = <TNetworkSymbol extends string>(
    { getFormats, getDefaultFormat, signMessage, verifyMessage }: NetworkSignVerify<TNetworkSymbol>,
    narrow: (symbol: NetworkSymbol) => TNetworkSymbol,
): NetworkSignVerify<NetworkSymbol> => ({
    getFormats: getFormats && ((symbol, accountType) => getFormats(narrow(symbol), accountType)),
    getDefaultFormat:
        getDefaultFormat &&
        ((symbol, accountType) => getDefaultFormat(narrow(symbol), accountType)),
    signMessage: params => signMessage({ ...params, symbol: narrow(params.symbol) }),
    verifyMessage:
        verifyMessage && (params => verifyMessage({ ...params, symbol: narrow(params.symbol) })),
});
