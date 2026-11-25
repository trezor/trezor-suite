import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { BackendSettings, Blockchain, BlockchainNetworks } from '@suite-common/wallet-types';

import {
    getBackendsToConnect,
    getCustomBackends,
    getDefaultBackendType,
    isDirectRpcBackendType,
    isTrezorConnectBackendType,
} from './backendUtils';

const blockchain = (backends: BackendSettings): Blockchain => ({
    connected: false,
    blockHash: '',
    blockHeight: 0,
    version: '',
    backends,
});

const btc = asNetworkSymbol('btc');
const eth = asNetworkSymbol('eth');
const base = asNetworkSymbol('base');
const op = asNetworkSymbol('op');

// Only the networks a test needs, the rest of the record is never read.
const blockchains = {
    btc: blockchain({ selected: 'electrum', urls: { electrum: ['electrum:50001:t'] } }),
    eth: blockchain({ urls: { blockbook: ['https://eth'] }, broadcastUrls: ['https://rpc'] }),
    base: blockchain({}),
    op: blockchain({
        selected: 'evm-rpc',
        urls: { 'evm-rpc': ['https://op'] },
        broadcastUrls: ['https://sequencer'],
    }),
} as BlockchainNetworks;

describe('backend utils', () => {
    test('getDefaultBackendType', () => {
        expect(getDefaultBackendType(asNetworkSymbol('btc'))).toBe('blockbook');
        expect(getDefaultBackendType(asNetworkSymbol('ltc'))).toBe('blockbook');
        expect(getDefaultBackendType(asNetworkSymbol('ada'))).toBe('blockfrost');
        expect(getDefaultBackendType(asNetworkSymbol('arc'))).toBe('evm-rpc');
        expect(getDefaultBackendType(asNetworkSymbol('tarc'))).toBe('evm-rpc');
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

    test('getBackendsToConnect also sends a default backend with a custom broadcast backend', () => {
        expect(getBackendsToConnect(blockchains, [btc, eth, base, op])).toEqual([
            { symbol: btc, type: 'electrum', urls: ['electrum:50001:t'] },
            { symbol: eth, type: 'blockbook', urls: [], broadcastUrls: ['https://rpc'] },
            {
                symbol: op,
                type: 'evm-rpc',
                urls: ['https://op'],
                broadcastUrls: ['https://sequencer'],
            },
        ]);
    });

    test('getCustomBackends lists only networks with a custom primary backend', () => {
        expect(getCustomBackends(blockchains, [btc, eth, base, op]).map(b => b.symbol)).toEqual([
            btc,
            op,
        ]);
    });
});
