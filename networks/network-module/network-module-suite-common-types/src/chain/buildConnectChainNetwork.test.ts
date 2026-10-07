import { asNetworkSymbol } from '@trezor/network-module-types';

import { ChainNetworkError } from './ChainNetworkError';
import {
    type ConnectChainNetworkDefinition,
    buildConnectChainNetwork,
} from './buildConnectChainNetwork';

const { signal } = new AbortController();

const fetchAccountBalance = jest.fn();
const fetchFiatRate = jest.fn();

const getDefinition = (
    overrides: Partial<ConnectChainNetworkDefinition> = {},
): ConnectChainNetworkDefinition => ({
    params: {
        symbol: asNetworkSymbol('btc'),
        backend: { type: 'blockbook', urls: [] },
        gapLimit: 25,
    },
    decimals: 8,
    accountSyncIntervalMs: 60_000,
    displayBalance: 'availableBalance',
    useConnectionIdentity: false,
    fetchAccountBalance,
    fetchFiatRate,
    ...overrides,
});

const ref = { symbol: asNetworkSymbol('btc'), descriptor: 'xpub', accountType: 'normal' } as const;

describe('buildConnectChainNetwork', () => {
    beforeEach(() => {
        fetchAccountBalance.mockReset();
        fetchFiatRate.mockReset();
    });

    it('scopes the network to its symbol and backend', () => {
        const network = buildConnectChainNetwork(getDefinition());

        expect(network).toMatchObject({
            symbol: asNetworkSymbol('btc'),
            backendType: 'blockbook',
            syncPolicy: { accountRefetchIntervalMs: 60_000, accountStaleTimeMs: 60_000 },
        });
    });

    it('fetches balances with the network rules', async () => {
        fetchAccountBalance.mockResolvedValue('balance');
        const network = buildConnectChainNetwork(getDefinition());

        await expect(network.getAccountBalance({ ref, signal })).resolves.toBe('balance');
        expect(fetchAccountBalance).toHaveBeenCalledWith({
            ref,
            signal,
            decimals: 8,
            displayBalance: 'availableBalance',
            useConnectionIdentity: false,
            gap: 25,
        });
    });

    it('refuses an account of another network', async () => {
        const network = buildConnectChainNetwork(getDefinition());

        await expect(
            network.getAccountBalance({ ref: { ...ref, symbol: asNetworkSymbol('ltc') }, signal }),
        ).rejects.toEqual(new ChainNetworkError('symbol-mismatch', asNetworkSymbol('btc')));
        expect(fetchAccountBalance).not.toHaveBeenCalled();
    });

    it('asks the rate source for its own symbol', async () => {
        fetchFiatRate.mockResolvedValue({ rate: 1, timestamp: 2 });
        const network = buildConnectChainNetwork(getDefinition());

        await expect(network.getNativeFiatRate({ currency: 'eur', signal })).resolves.toEqual({
            rate: 1,
            timestamp: 2,
        });
        expect(fetchFiatRate).toHaveBeenCalledWith({
            currency: 'eur',
            signal,
            symbol: asNetworkSymbol('btc'),
        });
    });

    it('has no rate without a rate source', async () => {
        const network = buildConnectChainNetwork(getDefinition({ fetchFiatRate: null }));

        await expect(network.getNativeFiatRate({ currency: 'eur', signal })).resolves.toBeNull();
    });
});
