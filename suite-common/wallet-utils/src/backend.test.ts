import {
    asNetworkSymbol,
    registerLegacyCustomEvmNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';
import { mockCustomEvmNetworkDefinition } from '@suite-common/wallet-types/mocks';

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
        const definition = mockCustomEvmNetworkDefinition();
        const { symbol } = definition;
        registerLegacyCustomEvmNetwork(definition);

        try {
            expect(getDefaultBackendType(symbol)).toBe('evm-rpc');
        } finally {
            unregisterLegacyNetwork(symbol);
        }

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
