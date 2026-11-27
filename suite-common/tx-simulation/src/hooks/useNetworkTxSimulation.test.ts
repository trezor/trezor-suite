import {
    asNetworkSymbol,
    registerLegacyCustomEvmNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';

import { TxSimulationChainUnsupportedError, toEvmScanError } from './useNetworkTxSimulation';
import { resolveBlockaidEvmChain } from '../chains';

const rejection = Object.assign(new Error('Chain not supported'), { status: 400 });

describe(toEvmScanError.name, () => {
    const symbol = asNetworkSymbol('evm77');

    beforeEach(() => {
        registerLegacyCustomEvmNetwork({
            symbol,
            chainId: 77,
            name: 'Custom',
            displaySymbol: 'CST',
            explorerUrl: 'https://explorer.custom.example',
            testnet: false,
        });
    });

    afterEach(() => {
        unregisterLegacyNetwork(symbol);
    });

    it('stops scanning a user-added chain Blockaid rejects', () => {
        expect(resolveBlockaidEvmChain(77)).toBe('0x4d');

        expect(toEvmScanError('0x4d', rejection)).toBeInstanceOf(TxSimulationChainUnsupportedError);
        expect(resolveBlockaidEvmChain(77)).toBeNull();
    });

    it.each([
        ['a named chain', 'ethereum', rejection],
        ['a server error', '0x4e', Object.assign(new Error('down'), { status: 503 })],
        ['a rate limit', '0x4e', Object.assign(new Error('slow down'), { status: 429 })],
        ['a network failure', '0x4e', new Error('fetch failed')],
    ])('passes %s through', (_, chain, error) => {
        expect(toEvmScanError(chain, error)).toBe(error);
    });
});
