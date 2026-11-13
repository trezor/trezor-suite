import type { NetworkSymbol } from '@trezor/network-module-types';

import type { MessageSigner } from './MessageSigner';

export const createMessageSigner = <TNetworkSymbol extends string>(
    { getFormats, getDefaultFormat, signMessage, verifyMessage }: MessageSigner<TNetworkSymbol>,
    narrow: (symbol: NetworkSymbol) => TNetworkSymbol,
): MessageSigner<NetworkSymbol> => ({
    getFormats: getFormats && ((symbol, accountType) => getFormats(narrow(symbol), accountType)),
    getDefaultFormat:
        getDefaultFormat &&
        ((symbol, accountType) => getDefaultFormat(narrow(symbol), accountType)),
    signMessage: params => signMessage({ ...params, symbol: narrow(params.symbol) }),
    verifyMessage:
        verifyMessage && (params => verifyMessage({ ...params, symbol: narrow(params.symbol) })),
});
