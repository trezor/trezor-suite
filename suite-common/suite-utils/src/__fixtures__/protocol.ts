import { Protocol } from '@suite-common/suite-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';

type getNetworkSymbolForProtocolFixture = {
    description: string;
    scheme: Protocol;
    result: NetworkSymbol | undefined;
};

export const getNetworkSymbolForProtocol: getNetworkSymbolForProtocolFixture[] = [
    {
        description: 'should return network symbol for bitcoin protocol',
        scheme: 'bitcoin',
        result: 'btc',
    },
    {
        description: 'should return network symbol for litecoin protocol',
        scheme: 'litecoin',
        result: 'ltc',
    },
    {
        description: 'should return undefined for unknown protocol',
        scheme: 'unknown' as Protocol,
        result: undefined,
    },
];
