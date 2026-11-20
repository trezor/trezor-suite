import { type NetworkSymbol, createNarrow, createNarrowAsync } from '@trezor/network-module-types';

import type { NetworkSignVerify } from './NetworkSignVerify';

export const createNetworkSignVerify = <TNetworkSymbol extends string>(
    { getFormats, getDefaultFormat, signMessage, verifyMessage }: NetworkSignVerify<TNetworkSymbol>,
    supportedNetworks: readonly TNetworkSymbol[],
): NetworkSignVerify<NetworkSymbol> => {
    const narrow = createNarrow(supportedNetworks);
    const narrowAsync = createNarrowAsync(supportedNetworks);

    return {
        getFormats: getFormats && narrow(getFormats),
        getDefaultFormat: getDefaultFormat && narrow(getDefaultFormat),
        signMessage: narrowAsync(signMessage),
        verifyMessage: verifyMessage && narrowAsync(verifyMessage),
    };
};
