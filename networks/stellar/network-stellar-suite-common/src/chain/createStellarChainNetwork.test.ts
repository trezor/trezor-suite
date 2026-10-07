import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StellarChainNetworkDeps,
    createStellarChainNetwork,
} from './createStellarChainNetwork';

const { signal } = new AbortController();

const getAccountInfo = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();
const fetchCoinGeckoHistoricRates = jest.fn();

const deps: StellarChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo }),
    fetchCoinGeckoCurrentRate,
    fetchCoinGeckoHistoricRates,
};

const xlm = asNetworkSymbol('xlm');
const network = createStellarChainNetwork(deps)({
    symbol: xlm,
    backend: { type: 'stellar', urls: [] },
});

const CONTRACT = `C${'A'.repeat(55)}`;

describe('createStellarChainNetwork', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('reads stroops and shows the full balance, reserve included', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '150000000', availableBalance: '140000000', empty: false },
        });

        await expect(
            network.getAccountBalance({
                ref: { symbol: xlm, descriptor: 'GADDRESS', accountType: 'normal' },
                signal,
            }),
        ).resolves.toMatchObject({ balance: '15', displayBalance: '15' });
    });

    it('reads trustline assets and the Soroban contracts the user watches', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                tokens: [
                    {
                        standard: 'STELLAR-CLASSIC',
                        contract: 'USDC-GISSUER',
                        decimals: 7,
                        balance: '20000000',
                    },
                    { standard: 'STELLAR-CONTRACT', contract: CONTRACT, decimals: 7, balance: '1' },
                ],
            },
        });

        const tokens = await network.getTokens?.({
            ref: {
                symbol: xlm,
                descriptor: 'GADDRESS',
                accountType: 'normal',
                watchedTokens: ['USDC-GISSUER', CONTRACT],
            },
            signal,
        });

        expect(tokens?.map(({ contract, balance }) => [contract, balance])).toEqual([
            ['USDC-GISSUER', '2'],
            [CONTRACT, '0.0000001'],
        ]);
        expect(getAccountInfo).toHaveBeenCalledTimes(1);
        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ details: 'basic', stellarContractTokens: [CONTRACT] }),
        );
    });

    it('values tokens with CoinGecko', async () => {
        fetchCoinGeckoCurrentRate.mockResolvedValue({ rate: 1, timestamp: 1 });

        await network.getTokenFiatRate?.({ contract: 'USDC-GISSUER', currency: 'eur', signal });

        expect(fetchCoinGeckoCurrentRate).toHaveBeenCalledWith(
            expect.objectContaining({ symbol: 'xlm', tokenAddress: 'USDC-GISSUER' }),
        );
    });

    it('pages its history by cursor with the Soroban contracts the user watches', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                history: { total: -1, transactions: [] },
                stellarCursor: 'cursor-2',
            },
        });

        const page = await network.getTransactions?.({
            ref: {
                symbol: xlm,
                descriptor: 'GADDRESS',
                accountType: 'normal',
                watchedTokens: [CONTRACT],
            },
            cursor: { page: 1 },
            signal,
        });

        // A page shorter than the page size is the end of the history.
        expect(page).toMatchObject({ nextCursor: null, total: null });
        expect(getAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({ pageSize: 25, stellarContractTokens: [CONTRACT] }),
        );
    });
});
