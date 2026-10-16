import { combineReducers } from '@reduxjs/toolkit';

import { fetchCurrentFiatRates, getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type Account,
    type AccountKey,
    type Timestamp,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { fiatRatesApi } from './fiatRatesApi';
import { prepareFiatRatesReducer } from './fiatRatesReducer';
import { selectCurrentFiatRates, selectHistoricFiatRates } from './fiatRatesSelectors';
import {
    type FetchMissingHistoricFiatRatesThunkState,
    type PrefetchFiatRatesThunkState,
    fetchMissingHistoricFiatRatesThunk,
    prefetchFiatRatesThunk,
} from './fiatRatesThunks';
import { type FiatRatesRootState } from './fiatRatesTypes';
import { blockchainInitialState } from '../blockchain/blockchainReducer';
import { initialWalletSettingsState } from '../settings/walletSettingsReducer';
import { transactionsInitialState } from '../transactions/transactionsReducer';

jest.mock('@suite-common/fiat-services', () => ({
    fetchCurrentFiatRates: jest.fn(),
    fetchLastWeekFiatRates: jest.fn(),
    fetchErc4626UnderlyingAsset: jest.fn(),
    getFiatRatesForTimestamps: jest.fn(),
}));

const ACCOUNT_KEY = 'descriptor-eth-device' as AccountKey;
const USD = 'usd' as BaseCurrencyCode;
const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const VAULT_CONTRACT = '0xbeef69b8fea9a16fb98a661860f6d78d94e1b000' as TokenAddress;
const HOUR_ALIGNED_TIMESTAMP = 1700002800 as Timestamp;

const ethAccount = {
    key: ACCOUNT_KEY,
    symbol: 'eth',
    tokens: [
        { contract: USDT_CONTRACT, decimals: 6, balance: '1' },
        { contract: VAULT_CONTRACT, decimals: 6, balance: '1', protocols: ['erc4626'] },
    ],
} as unknown as Account;

const testnetAccount = {
    key: 'descriptor-test-device' as AccountKey,
    symbol: 'test',
    tokens: [],
} as unknown as Account;

const tokenTransaction = (contract: TokenAddress): WalletAccountTransaction =>
    ({
        txid: `tx-${contract}`,
        symbol: 'eth',
        blockTime: HOUR_ALIGNED_TIMESTAMP,
        tokens: [{ contract, standard: 'ERC20', amount: '1000000', decimals: 6 }],
    }) as unknown as WalletAccountTransaction;

type State = PrefetchFiatRatesThunkState &
    FetchMissingHistoricFiatRatesThunkState &
    FiatRatesRootState;

const fiatRatesReducer = prepareFiatRatesReducer({
    actionTypes: { storageLoad: '@suite/storage/load' },
    reducers: { storageLoadHistoricRates: state => state },
});

const stores: { dispatch: (action: ReturnType<typeof fiatRatesApi.util.resetApiState>) => void }[] =
    [];

afterEach(() => {
    // Clears the pending cache removal timers of RTK Query.
    stores.splice(0).forEach(store => store.dispatch(fiatRatesApi.util.resetApiState()));
});

const createStore = () =>
    createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            [fiatRatesApi.reducerPath]: fiatRatesApi.reducer,
            wallet: combineReducers({
                accounts: (state = [ethAccount, testnetAccount]) => state,
                blockchain: (state = blockchainInitialState) => state,
                fiat: fiatRatesReducer,
                settings: (state = { ...initialWalletSettingsState, localCurrency: USD }) => state,
                transactions: (
                    state = {
                        ...transactionsInitialState,
                        transactions: {
                            [ACCOUNT_KEY]: [
                                tokenTransaction(USDT_CONTRACT),
                                tokenTransaction(VAULT_CONTRACT),
                            ],
                        },
                    },
                ) => state,
            }),
            tokenDefinitions: (
                state = {
                    eth: {
                        coin: {
                            data: [USDT_CONTRACT, VAULT_CONTRACT],
                            error: false,
                            isLoading: false,
                        },
                    },
                },
            ) => state,
        }) as unknown as (state: State | undefined, action: { type: string }) => State,
        middleware: [fiatRatesApi.middleware],
    }).services.store;

const initStore = () => {
    const store = createStore();
    stores.push(store);

    return store;
};

describe('prefetchFiatRatesThunk', () => {
    beforeEach(() => {
        jest.mocked(fetchCurrentFiatRates).mockResolvedValue({
            rate: 1,
            usdRate: 1,
            lastTickerTimestamp: HOUR_ALIGNED_TIMESTAMP,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('prefetches the current rates of all mainnet account tickers', async () => {
        const store = initStore();

        store.dispatch(prefetchFiatRatesThunk({ rateType: 'current' }));
        await Promise.all(store.dispatch(fiatRatesApi.util.getRunningQueriesThunk()));

        expect(Object.keys(selectCurrentFiatRates(store.getState())).sort()).toEqual(
            [`eth-${USDT_CONTRACT}-usd`, `eth-${VAULT_CONTRACT}-usd`, 'eth-usd'].sort(),
        );
    });

    it('does not fetch rates that are still fresh', async () => {
        const store = initStore();

        store.dispatch(prefetchFiatRatesThunk({ rateType: 'current' }));
        await Promise.all(store.dispatch(fiatRatesApi.util.getRunningQueriesThunk()));
        const fetchCountAfterFirstPrefetch = jest.mocked(fetchCurrentFiatRates).mock.calls.length;
        store.dispatch(prefetchFiatRatesThunk({ rateType: 'current' }));
        await Promise.all(store.dispatch(fiatRatesApi.util.getRunningQueriesThunk()));

        expect(fetchCountAfterFirstPrefetch).toBeGreaterThan(0);
        expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(fetchCountAfterFirstPrefetch);
    });
});

describe('fetchMissingHistoricFiatRatesThunk', () => {
    beforeEach(() => {
        jest.mocked(getFiatRatesForTimestamps).mockImplementation((_tickerId, timestamps) =>
            Promise.resolve({
                ts: 0,
                symbol: 'eth',
                tickers: timestamps.map(ts => ({ ts, rates: { usd: 1 } })),
            }),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('fetches historic rates of the coin and regular tokens, but not of ERC4626 tokens', async () => {
        const store = initStore();

        await store.dispatch(fetchMissingHistoricFiatRatesThunk({ accountKey: ACCOUNT_KEY }));

        expect(selectHistoricFiatRates(store.getState())).toEqual({
            'eth-usd': { [HOUR_ALIGNED_TIMESTAMP]: 1 },
            [`eth-${USDT_CONTRACT}-usd`]: { [HOUR_ALIGNED_TIMESTAMP]: 1 },
        });
    });

    it('does not fetch historic rates that are already known', async () => {
        const store = initStore();

        await store.dispatch(fetchMissingHistoricFiatRatesThunk({ accountKey: ACCOUNT_KEY }));
        await store.dispatch(fetchMissingHistoricFiatRatesThunk({ accountKey: ACCOUNT_KEY }));

        expect(getFiatRatesForTimestamps).toHaveBeenCalledTimes(2);
    });
});
