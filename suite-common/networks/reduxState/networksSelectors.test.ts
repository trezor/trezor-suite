import { asNetworkSymbol } from '@trezor/network-module-types';

import { type NetworksRootState, networksActions, networksReducer } from './networksReducer';
import { selectNativeTokenName } from './networksSelectors';
import { getMockNetworkMetadata } from '../mocks/mockNetworkMetadata';

const eth = asNetworkSymbol('eth');

const ethereumLayer2 = (symbol: string, displaySymbolName: string) => ({
    ...getMockNetworkMetadata(symbol),
    settlementLayer: eth,
    displaySymbolName,
});

const withDisplaySymbolName = (symbol: string, displaySymbolName: string) => ({
    ...getMockNetworkMetadata(symbol),
    displaySymbolName,
});

describe('selectNativeTokenName', () => {
    const state: NetworksRootState = {
        networks: networksReducer(
            null,
            networksActions.setNetworks([
                getMockNetworkMetadata('eth'),
                ethereumLayer2('arb', 'Arbitrum One Ethereum'),
                ethereumLayer2('base', 'Base Ethereum'),
                ethereumLayer2('op', 'Optimism Ethereum'),
                withDisplaySymbolName('pol', 'Polygon'),
                withDisplaySymbolName('bsc', 'BNB'),
            ]),
        ),
    };

    it.each(['eth', 'arb', 'base', 'op'])('names the native token of %s "Ethereum"', symbol => {
        expect(selectNativeTokenName(state, asNetworkSymbol(symbol))).toBe('Ethereum');
    });

    it.each([
        ['pol', 'Polygon'],
        ['bsc', 'BNB'],
    ])('names the native token of %s by its display name', (symbol, name) => {
        expect(selectNativeTokenName(state, asNetworkSymbol(symbol))).toBe(name);
    });
});
