import { type NetworkSymbol } from '@suite-common/networks';
import { type Protocol } from '@suite-common/suite-constants';
type GetNetworkSymbolForProtocolFixture = {
    description: string;
    scheme: Protocol;
    result: NetworkSymbol | undefined;
};

export const getNetworkSymbolForProtocol: GetNetworkSymbolForProtocolFixture[] = [
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
