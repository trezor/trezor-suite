import { Protocol, NETWORK_TO_PROTOCOLS } from '@suite-common/suite-constants';
import { isNetworkSymbol, NetworkSymbol } from '@suite-common/wallet-config';

export type ProtocolToNetwork = {
    [P in Protocol]: NetworkSymbol;
};

export const getNetworkSymbolForProtocol = (protocol: Protocol): NetworkSymbol | undefined => {
    for (const symbolKey in NETWORK_TO_PROTOCOLS) {
        const symbol = symbolKey;

        if (!isNetworkSymbol(symbol)) continue;

        const protocols = NETWORK_TO_PROTOCOLS[symbol];

        if (protocols.includes(protocol)) {
            return symbol;
        }
    }

    return undefined;
};
