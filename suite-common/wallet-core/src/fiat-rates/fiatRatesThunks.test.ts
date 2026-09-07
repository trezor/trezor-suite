import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { createTestStore } from '@suite-common/test-utils';
import {
    type Account,
    type AccountKey,
    type TickerResult,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { pruneHistoricFiatRatesThunk, updateTxsFiatRatesThunk } from './fiatRatesThunks';
import { blockchainInitialState } from '../blockchain/blockchainReducer';

jest.mock('@suite-common/fiat-services', () => ({
    getFiatRatesForTimestamps: jest.fn(),
}));

const ACCOUNT_KEY = 'descriptor-eth-device' as AccountKey;
const LOCAL_CURRENCY = 'usd' as BaseCurrencyCode;

const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const VAULT_CONTRACT = '0xbeef69b8fea9a16fb98a661860f6d78d94e1b000' as TokenAddress;

const ethAccount = {
    key: ACCOUNT_KEY,
    symbol: 'eth',
    tokens: [
        { contract: USDT_CONTRACT, decimals: 6 },
        { contract: VAULT_CONTRACT, decimals: 6, protocols: ['erc4626'] },
    ],
} as unknown as Account;

// Historic rates are keyed by the transaction's block time rounded down to the whole hour.
const HOUR = 1700002800;
const NEXT_HOUR = HOUR + 3600;

const tokenTransaction = (contract: TokenAddress): WalletAccountTransaction =>
    ({
        txid: `tx-${contract}`,
        symbol: 'eth',
        blockTime: HOUR,
        tokens: [{ contract, standard: 'ERC20', amount: '1000000', decimals: 6 }],
    }) as unknown as WalletAccountTransaction;

const initStore = () =>
    createTestStore({
        extra: undefined,
        preloadedState: {
            wallet: {
                accounts: [ethAccount],
                blockchain: blockchainInitialState,
            },
            tokenDefinitions: {
                eth: {
                    coin: {
                        data: [USDT_CONTRACT, VAULT_CONTRACT],
                        error: false,
                        isLoading: false,
                    },
                },
            },
        },
    });

describe('updateTxsFiatRatesThunk', () => {
    beforeEach(() => {
        jest.mocked(getFiatRatesForTimestamps).mockImplementation((_tickerId, timestamps) =>
            Promise.resolve({
                ts: 0,
                symbol: 'eth',
                tickers: timestamps.map(ts => ({ ts, rates: { usd: 1 } })),
            }),
        );
    });

    it('fetches historic rates of regular tokens, but not of ERC4626 tokens', async () => {
        const store = initStore();

        const response = await store.dispatch(
            updateTxsFiatRatesThunk({
                accountKey: ACCOUNT_KEY,
                txs: [tokenTransaction(USDT_CONTRACT), tokenTransaction(VAULT_CONTRACT)],
                baseCurrencyCode: LOCAL_CURRENCY,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');

        const { rates } = response.payload as { rates: TickerResult[] };
        const tokenAddresses = rates.map(({ tickerId }) => tickerId.tokenAddress);

        expect(tokenAddresses).toContain(USDT_CONTRACT);
        expect(tokenAddresses).not.toContain(VAULT_CONTRACT);
    });
});

const USDT_RATE_KEY = `eth-${USDT_CONTRACT}-usd`;

const btcTransaction = {
    txid: 'btc-tx',
    symbol: 'btc',
    blockTime: HOUR,
    tokens: [],
} as unknown as WalletAccountTransaction;

const initPruneStore = ({
    transactions,
    historic,
}: {
    transactions: Record<string, Array<WalletAccountTransaction | null>>;
    historic: Record<string, Record<number, number>>;
}) =>
    createTestStore({
        extra: undefined,
        preloadedState: {
            wallet: {
                fiat: { current: {}, lastWeek: {}, historic },
                transactions: { transactions },
            },
        },
    });

describe('pruneHistoricFiatRatesThunk', () => {
    it('keeps token rates of a referenced transaction', async () => {
        const store = initPruneStore({
            transactions: { 'acc-a': [tokenTransaction(USDT_CONTRACT)] },
            historic: {
                'eth-usd': { [HOUR]: 3000 },
                [USDT_RATE_KEY]: { [HOUR]: 1 },
                'btc-usd': { [HOUR]: 50000 },
            },
        });

        const { payload } = await store.dispatch(pruneHistoricFiatRatesThunk());

        expect(payload).toEqual({ 'eth-usd': { [HOUR]: 3000 }, [USDT_RATE_KEY]: { [HOUR]: 1 } });
    });

    it('returns nothing when every rate is still referenced', async () => {
        const store = initPruneStore({
            transactions: { 'acc-a': [btcTransaction] },
            historic: { 'btc-usd': { [HOUR]: 50000 } },
        });

        const { payload } = await store.dispatch(pruneHistoricFiatRatesThunk());

        expect(payload).toBeUndefined();
    });

    it('drops unreferenced rates, ignoring empty slots in a paginated transaction list', async () => {
        const store = initPruneStore({
            transactions: { 'acc-a': [null, btcTransaction, null] },
            historic: { 'btc-usd': { [HOUR]: 50000, [NEXT_HOUR]: 51000 } },
        });

        const { payload } = await store.dispatch(pruneHistoricFiatRatesThunk());

        expect(payload).toEqual({ 'btc-usd': { [HOUR]: 50000 } });
    });
});
