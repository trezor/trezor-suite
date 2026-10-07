import { asNetworkSymbol } from '@trezor/network-module-types';

import { type RippleChainNetworkDeps, createRippleChainNetwork } from './createRippleChainNetwork';

const { signal } = new AbortController();

const getAccountInfo = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();

const deps: RippleChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo }),
    fetchCoinGeckoCurrentRate,
};

const createNetwork = (symbol: 'xrp' | 'txrp') =>
    createRippleChainNetwork(deps)({
        symbol: asNetworkSymbol(symbol),
        backend: { type: 'ripple', urls: [] },
    });

describe('createRippleChainNetwork', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('shows the full balance, reserve included', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '25000000', availableBalance: '24000000', empty: false },
        });

        await expect(
            createNetwork('xrp').getAccountBalance({
                ref: {
                    symbol: asNetworkSymbol('xrp'),
                    descriptor: 'rAddress',
                    accountType: 'normal',
                },
                signal,
            }),
        ).resolves.toEqual({
            balance: '25',
            availableBalance: '24',
            displayBalance: '25',
            empty: false,
        });
    });

    it('reads no tokens', () => {
        const network = createNetwork('xrp');

        expect(network.getTokens).toBeUndefined();
        expect(network.getTokenFiatRate).toBeUndefined();
    });

    it('values XRP with CoinGecko and has no rate on testnet', async () => {
        fetchCoinGeckoCurrentRate.mockResolvedValue({ rate: 2, timestamp: 1 });

        await expect(
            createNetwork('xrp').getNativeFiatRate({ currency: 'usd', signal }),
        ).resolves.toEqual({ rate: 2, timestamp: 1 });
        await expect(
            createNetwork('txrp').getNativeFiatRate({ currency: 'usd', signal }),
        ).resolves.toBeNull();
    });
});
