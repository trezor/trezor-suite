import {
    asNetworkSymbol,
    registerLegacyCustomEvmNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';

import {
    getDefaultBackendType,
    isDirectRpcBackendType,
    isTrezorConnectBackendType,
} from './backendUtils';

describe('backend utils', () => {
    test('getDefaultBackendType', () => {
        expect(getDefaultBackendType(asNetworkSymbol('btc'))).toBe('blockbook');
        expect(getDefaultBackendType(asNetworkSymbol('ltc'))).toBe('blockbook');
        expect(getDefaultBackendType(asNetworkSymbol('ada'))).toBe('blockfrost');
        expect(getDefaultBackendType(asNetworkSymbol('arc'))).toBe('evm-rpc');
        expect(getDefaultBackendType(asNetworkSymbol('tarc'))).toBe('evm-rpc');
        expect(getDefaultBackendType(asNetworkSymbol('eth'))).toBe('blockbook');
        expect(getDefaultBackendType(asNetworkSymbol('tsep'))).toBe('blockbook');
        expect(getDefaultBackendType(asNetworkSymbol('sol'))).toBe('solana');
    });

    test('getDefaultBackendType of a custom EVM network', () => {
        const symbol = asNetworkSymbol('evm4242');
        registerLegacyCustomEvmNetwork({
            symbol,
            chainId: 4242,
            name: 'Custom',
            displaySymbol: 'CUS',
            explorerUrl: 'https://explorer.custom.example',
            testnet: false,
        });

        expect(getDefaultBackendType(symbol)).toBe('evm-rpc');

        unregisterLegacyNetwork(symbol);

        expect(getDefaultBackendType(symbol)).toBe('blockbook');
    });

    test('isDirectRpcBackendType', () => {
        expect(isDirectRpcBackendType('evm-rpc')).toBe(true);
        expect(isDirectRpcBackendType('blockbook')).toBe(false);
        expect(isDirectRpcBackendType()).toBe(false);
    });

    test('isTrezorConnectBackendType', () => {
        expect(isTrezorConnectBackendType()).toBe(true);
        expect(isTrezorConnectBackendType('blockbook')).toBe(true);
        expect(isTrezorConnectBackendType('coinjoin')).toBe(false);
        // @ts-expect-error
        expect(isTrezorConnectBackendType('gibberish')).toBe(false);
        // @ts-expect-error
        expect(isTrezorConnectBackendType({})).toBe(false);
    });
});
