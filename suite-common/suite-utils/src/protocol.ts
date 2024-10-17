import { Protocol, NETWORK_TO_PROTOCOLS } from '@suite-common/suite-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';

export type ProtocolToNetwork = {
    [P in Protocol]: NetworkSymbol;
};

export const getNetworkSymbolForProtocol = (protocol: Protocol): NetworkSymbol | undefined => {
    for (const networkSymbol in NETWORK_TO_PROTOCOLS) {
        const protocols = NETWORK_TO_PROTOCOLS[networkSymbol as NetworkSymbol];
        if (protocols.includes(protocol)) {
            return networkSymbol as NetworkSymbol;
        }
    }

    return undefined;
};
