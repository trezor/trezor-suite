import { asNetworkSymbol } from '@trezor/network-module-types';

import { type SolanaChainNetworkDeps, createSolanaChainNetwork } from './createSolanaChainNetwork';

const { signal } = new AbortController();

const getAccountInfo = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();
const fetchCoinGeckoHistoricRates = jest.fn();

const deps: SolanaChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo }),
    fetchCoinGeckoCurrentRate,
    fetchCoinGeckoHistoricRates,
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

    it('reads SPL tokens by mint', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                tokens: [
                    { standard: 'SPL', contract: 'UsdcMint', decimals: 6, balance: '2500000' },
                    { standard: 'SPL-2022', contract: 'NewMint', decimals: 9, balance: '1' },
                ],
            },
        });
        const network = createSolanaChainNetwork(deps)({ symbol: asNetworkSymbol('sol'), backend });

        const tokens = await network.getTokens?.({
            ref: {
                symbol: asNetworkSymbol('sol'),
                descriptor: 'solAddress',
                accountType: 'normal',
            },
            signal,
        });

        expect(tokens?.map(({ contract, balance }) => [contract, balance])).toEqual([
            ['UsdcMint', '2.5'],
            ['NewMint', '0.000000001'],
        ]);
        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'sol', details: 'tokenBalances' }),
        );
    });

    it('pages its history 8 transactions at a time by transaction count', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                history: { total: 20, transactions: [] },
                page: { index: 0, size: 8, total: 20 },
            },
        });
        const network = createSolanaChainNetwork(deps)({ symbol: asNetworkSymbol('sol'), backend });

        const page = await network.getTransactions?.({
            ref: {
                symbol: asNetworkSymbol('sol'),
                descriptor: 'solAddress',
                accountType: 'normal',
            },
            cursor: { page: 1 },
            signal,
        });

        expect(page?.nextCursor).toEqual({ page: 2 });
        expect(getAccountInfo).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 8 }));
    });
});
