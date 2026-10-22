/**
 * @jest-environment jsdom
 */
import { combineReducers } from '@reduxjs/toolkit';

import { fetchCurrentFiatRates } from '@suite-common/fiat-services';
import {
    cleanup,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type Account, type AccountKey, type Timestamp } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useAccountFiatRates } from './useAccountFiatRates';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { blockchainInitialState } from '../../blockchain/blockchainReducer';
import { initialWalletSettingsState } from '../../settings/walletSettingsReducer';
import { type FiatRatesApiQueryState, fiatRatesApi } from '../fiatRatesApi';
import { type FiatRatesRootState } from '../fiatRatesTypes';

jest.mock('@suite-common/fiat-services', () => ({
    fetchCurrentFiatRates: jest.fn(),
    fetchLastWeekFiatRates: jest.fn(),
    fetchErc4626UnderlyingAsset: jest.fn(),
    getFiatRatesForTimestamps: jest.fn(),
}));

const USD = 'usd' as BaseCurrencyCode;
const BTC_ACCOUNT_KEY = 'btc-account' as AccountKey;

const accounts = [
    { key: BTC_ACCOUNT_KEY, symbol: 'btc', tokens: [] },
    { key: 'ltc-account', symbol: 'ltc', tokens: [] },
] as unknown as Account[];

type State = FiatRatesRootState &
    FiatRatesApiQueryState &
    AccountsRootState &
    TokenDefinitionsRootState;

const createServices = () =>
    createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            [fiatRatesApi.reducerPath]: fiatRatesApi.reducer,
            wallet: combineReducers({
                accounts: (state = accounts) => state,
                blockchain: (state = blockchainInitialState) => state,
                fiat: (state = { historic: {} }) => state,
                settings: (state = { ...initialWalletSettingsState, localCurrency: USD }) => state,
            }),
            tokenDefinitions: (state = {}) => state,
        }) as unknown as (state: State | undefined, action: { type: string }) => State,
        middleware: [fiatRatesApi.middleware],
    }).services;

describe(useAccountFiatRates.name, () => {
    let services: ReturnType<typeof createServices>;

    beforeEach(() => {
        jest.mocked(fetchCurrentFiatRates).mockResolvedValue({
            rate: 1,
            usdRate: 1,
            lastTickerTimestamp: 1700000000 as Timestamp,
        });
        services = createServices();
    });

    afterEach(() => {
        cleanup();
        services.store.dispatch(fiatRatesApi.util.resetApiState());
        jest.clearAllMocks();
    });

    it('fetches only the rates of the given account', async () => {
        renderHookWithStoreProvider(() => useAccountFiatRates({ accountKey: BTC_ACCOUNT_KEY }), {
            services,
        });

        await waitFor(() => expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(1));
        expect(jest.mocked(fetchCurrentFiatRates).mock.calls[0]?.[0].ticker).toEqual({
            symbol: 'btc',
        });
    });

    it('fetches nothing without an account', () => {
        renderHookWithStoreProvider(() => useAccountFiatRates({ accountKey: undefined }), {
            services,
        });

        expect(fetchCurrentFiatRates).not.toHaveBeenCalled();
    });
});
