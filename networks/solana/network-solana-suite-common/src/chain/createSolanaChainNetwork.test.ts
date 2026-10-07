import { asNetworkSymbol } from '@trezor/network-module-types';

import { type SolanaChainNetworkDeps, createSolanaChainNetwork } from './createSolanaChainNetwork';

const { signal } = new AbortController();

const getAccountInfo = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();

const deps: SolanaChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo }),
    fetchCoinGeckoCurrentRate,
};

const backend = { type: 'solana', urls: [] } as const;

describe('createSolanaChainNetwork', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('reads lamports and refreshes at the Solana interval', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '1500000000', availableBalance: '1500000000', empty: false },
        });
        const network = createSolanaChainNetwork(deps)({ symbol: asNetworkSymbol('sol'), backend });

        await expect(
            network.getAccountBalance({
                ref: {
                    symbol: asNetworkSymbol('sol'),
                    descriptor: 'solAddress',
                    accountType: 'normal',
                },
                signal,
            }),
        ).resolves.toEqual(expect.objectContaining({ displayBalance: '1.5' }));
        expect(network.syncPolicy.accountRefetchIntervalMs).toBe(5 * 60 * 1000);
    });

    it('takes the rate from CoinGecko', async () => {
        fetchCoinGeckoCurrentRate.mockResolvedValue({ rate: 150, timestamp: 3 });
        const network = createSolanaChainNetwork(deps)({ symbol: asNetworkSymbol('sol'), backend });

        await expect(network.getNativeFiatRate({ currency: 'usd', signal })).resolves.toEqual({
            rate: 150,
            timestamp: 3,
        });
        expect(fetchCoinGeckoCurrentRate).toHaveBeenCalledWith({
            symbol: asNetworkSymbol('sol'),
            currency: 'usd',
            signal,
        });
    });

    it('has no fiat rate on devnet', async () => {
        const network = createSolanaChainNetwork(deps)({
            symbol: asNetworkSymbol('dsol'),
            backend,
        });

        await expect(network.getNativeFiatRate({ currency: 'usd', signal })).resolves.toBeNull();
    });
});
