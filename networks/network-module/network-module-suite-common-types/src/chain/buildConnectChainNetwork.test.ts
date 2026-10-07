import { asNetworkSymbol } from '@trezor/network-module-types';

import { ChainNetworkError } from './ChainNetworkError';
import {
    type ConnectChainNetworkDefinition,
    buildConnectChainNetwork,
} from './buildConnectChainNetwork';

const { signal } = new AbortController();

const fetchAccountBalance = jest.fn();
const fetchFiatRate = jest.fn();
const fetchTokens = jest.fn();
const fetchTokenFiatRate = jest.fn();

const getDefinition = (
    overrides: Partial<ConnectChainNetworkDefinition> = {},
): ConnectChainNetworkDefinition => ({
    params: {
        symbol: asNetworkSymbol('btc'),
        backend: { type: 'blockbook', urls: [] },
        gapLimit: 25,
    },
    nativeAsset: { symbol: 'BTC', name: 'Bitcoin' },
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
        jest.resetAllMocks();
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

    it('has no token capabilities without tokens', () => {
        const network = buildConnectChainNetwork(getDefinition());

        expect(network.getTokens).toBeUndefined();
        expect(network.getTokenFiatRate).toBeUndefined();
    });

    it('reads tokens with the network rules', async () => {
        fetchTokens.mockResolvedValue(['token']);
        const network = buildConnectChainNetwork(
            getDefinition({
                useConnectionIdentity: true,
                tokens: { fetchTokens, fungibleStandards: ['ERC20'], fetchTokenFiatRate },
            }),
        );

        await expect(network.getTokens?.({ ref, signal })).resolves.toEqual(['token']);
        expect(fetchTokens).toHaveBeenCalledWith({
            ref,
            signal,
            fungibleStandards: ['ERC20'],
            useConnectionIdentity: true,
        });
    });

    it('refuses tokens of an account of another network', async () => {
        const network = buildConnectChainNetwork(
            getDefinition({
                tokens: { fetchTokens, fungibleStandards: ['ERC20'], fetchTokenFiatRate },
            }),
        );

        await expect(
            network.getTokens?.({ ref: { ...ref, symbol: asNetworkSymbol('ltc') }, signal }),
        ).rejects.toEqual(new ChainNetworkError('symbol-mismatch', asNetworkSymbol('btc')));
        expect(fetchTokens).not.toHaveBeenCalled();
    });

    it('asks the rate source for the token of its own network', async () => {
        fetchTokenFiatRate.mockResolvedValue({ rate: 1, timestamp: 2 });
        const network = buildConnectChainNetwork(
            getDefinition({
                tokens: { fetchTokens, fungibleStandards: ['ERC20'], fetchTokenFiatRate },
            }),
        );

        await network.getTokenFiatRate?.({ contract: '0xusdc', currency: 'eur', signal });

        expect(fetchTokenFiatRate).toHaveBeenCalledWith({
            symbol: 'btc',
            currency: 'eur',
            signal,
            tokenAddress: '0xusdc',
        });
    });

    it('has no token rate without a token rate source', async () => {
        const network = buildConnectChainNetwork(
            getDefinition({
                tokens: { fetchTokens, fungibleStandards: ['ERC20'], fetchTokenFiatRate: null },
            }),
        );

        await expect(
            network.getTokenFiatRate?.({ contract: '0xusdc', currency: 'eur', signal }),
        ).resolves.toBeNull();
    });
});
