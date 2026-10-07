import { asNetworkSymbol } from '@trezor/network-module-types';

import type { SuiteCommonNetworkConfig } from '../SuiteCommonNetworkConfig';
import { ChainNetworkError } from './ChainNetworkError';
import { readChainNetworkConfig } from './readChainNetworkConfig';

const configs: Record<'abc' | 'tabc', Partial<SuiteCommonNetworkConfig>> = {
    abc: {
        displaySymbol: 'ABC',
        name: 'Abc',
        decimals: 6,
        testnet: false,
        backendOptions: [{ type: 'blockbook' }],
    },
    tabc: {
        displaySymbol: 'tABC',
        displaySymbolName: 'Abc Testnet',
        name: 'Abc testnet',
        decimals: 6,
        testnet: true,
        backendOptions: [{ type: 'ripple' }],
    },
};

const source = {
    isSupportedNetwork: (symbol: string): symbol is 'abc' | 'tabc' => symbol in configs,
    getNetworkConfig: (symbol: 'abc' | 'tabc') => configs[symbol] as SuiteCommonNetworkConfig,
    getAccountSyncInterval: () => 30_000,
};

describe('readChainNetworkConfig', () => {
    it('reads what a chain network needs from the network config', () => {
        expect(readChainNetworkConfig(source, asNetworkSymbol('abc'))).toEqual({
            nativeAsset: { symbol: 'ABC', name: 'Abc' },
            decimals: 6,
            accountSyncIntervalMs: 30_000,
            isTestnet: false,
            hasFiatRate: true,
            hasBlockbookRates: true,
        });
    });

    it('gives testnets no rate and names the asset as the user sees it', () => {
        expect(readChainNetworkConfig(source, asNetworkSymbol('tabc'))).toMatchObject({
            nativeAsset: { symbol: 'tABC', name: 'Abc Testnet' },
            isTestnet: true,
            hasFiatRate: false,
            hasBlockbookRates: false,
        });
    });

    it('refuses a symbol of another network family', () => {
        expect(() => readChainNetworkConfig(source, asNetworkSymbol('btc'))).toThrow(
            new ChainNetworkError('unsupported-network', asNetworkSymbol('btc')),
        );
    });
});
