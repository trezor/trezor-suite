import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type CardanoChainNetworkDeps,
    createCardanoChainNetwork,
} from './createCardanoChainNetwork';

const { signal } = new AbortController();

const getAccountInfo = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();
const fetchCoinGeckoHistoricRates = jest.fn();

const deps: CardanoChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo }),
    fetchCoinGeckoCurrentRate,
    fetchCoinGeckoHistoricRates,
};

const ada = asNetworkSymbol('ada');
const network = createCardanoChainNetwork(deps)({
    symbol: ada,
    backend: { type: 'blockfrost', urls: [] },
});
const ref = { symbol: ada, descriptor: 'cardanoXpub', accountType: 'normal' } as const;

const POLICY_ID = 'a'.repeat(56);

describe('createCardanoChainNetwork', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('reads lovelace and shows the available balance', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '3000000', availableBalance: '2500000', empty: false },
        });

        await expect(network.getAccountBalance({ ref, signal })).resolves.toEqual({
            balance: '3',
            availableBalance: '2.5',
            displayBalance: '2.5',
            empty: false,
        });
        expect(network.nativeAsset.symbol).toBe('ADA');
    });

    it('reads native tokens by policy id and asset name', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                tokens: [
                    {
                        standard: 'BLOCKFROST',
                        contract: `${POLICY_ID}4d494e`,
                        symbol: 'MIN',
                        decimals: 6,
                        balance: '1500000',
                    },
                ],
            },
        });

        await expect(network.getTokens?.({ ref, signal })).resolves.toEqual([
            expect.objectContaining({ contract: `${POLICY_ID}4d494e`, balance: '1.5' }),
        ]);
        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'ada', details: 'tokenBalances' }),
        );
    });

    it('values the coin and its tokens with CoinGecko', async () => {
        fetchCoinGeckoCurrentRate.mockResolvedValue({ rate: 0.5, timestamp: 1 });

        await network.getNativeFiatRate({ currency: 'usd', signal });
        await network.getTokenFiatRate?.({ contract: POLICY_ID, currency: 'usd', signal });

        expect(fetchCoinGeckoCurrentRate.mock.calls.map(([params]) => params.tokenAddress)).toEqual(
            [undefined, POLICY_ID],
        );
    });

    it('pages its history 8 transactions at a time', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                history: { total: 30, transactions: [{ txid: 'a' }] },
                page: { index: 1, size: 8, total: 2 },
            },
        });

        const page = await network.getTransactions?.({
            ref,
            cursor: { page: 1 },
            signal,
        });

        expect(page?.nextCursor).toEqual({ page: 2 });
        expect(getAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({ details: 'txs', page: 1, pageSize: 8 }),
        );
    });
});
