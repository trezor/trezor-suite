import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type LoadInitialDataThunkDeps } from '@suite-common/trading';
import {
    mockGetSelectedAccount,
    mockGetTradingEnvironment,
    mockTradingQueryClient,
} from '@suite-common/trading/mocks';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type LocaleSliceRootState, localeReducer } from '@suite-native/intl';
import {
    act,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
} from '@suite-native/trading-fixtures';
import { type TradingRootState, tradingSlice } from '@suite-native/trading-state';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { useTradeSectionCatalogs } from './useTradeSectionCatalogs';

// The trading load thunk also selects accounts, wallet settings and locale.
type State = TradingRootState & AccountsRootState & WalletSettingsRootState & LocaleSliceRootState;

const buyTrade = getBuyTrade({ status: undefined });
const sellTrade = getSellTrade({ status: undefined });
const exchangeTrade = getExchangeTrade({ status: undefined });
const accounts: Account[] = [];

const initServices = () =>
    createTestCompositionRoot<LoadInitialDataThunkDeps, State>({
        reducer: {
            locale: localeReducer,
            wallet: combineReducers({
                settings: createStaticReducer(initialWalletSettingsState),
                accounts: createStaticReducer(accounts),
                trading: tradingSlice.prepareReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                }),
            }),
        },
        preloadedState: {
            wallet: {
                trading: {
                    ...getInitializedTradingState(),
                    trades: [buyTrade, sellTrade, exchangeTrade],
                },
            },
        },
        services: () => ({
            getSelectedAccount: mockGetSelectedAccount(),
            getTradingEnvironment: mockGetTradingEnvironment(),
            queryClient: mockTradingQueryClient(),
        }),
    }).services;

const renderUseTradeSectionCatalogs = async (orderId: string) => {
    await renderHookWithStoreProvider(() => useTradeSectionCatalogs(orderId), {
        services: initServices(),
    });
    await act(() => Promise.resolve()); // Wait for all effects to run
};

describe('useTradeSectionCatalogs', () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
            json: () => Promise.resolve({ coins: {}, platforms: {}, config: {} }),
            ok: true,
        });
    });

    it.each([
        { tradeType: 'buy', orderId: buyTrade.data.orderId, catalogPath: '/api/v3/buy/list' },
        { tradeType: 'sell', orderId: sellTrade.data.orderId, catalogPath: '/api/v3/sell/list' },
        {
            tradeType: 'exchange',
            orderId: exchangeTrade.data.orderId,
            catalogPath: '/api/v3/exchange/list',
        },
    ])(
        'loads the coin info and the catalog of the $tradeType section for its trade',
        async ({ orderId, catalogPath }) => {
            await renderUseTradeSectionCatalogs(orderId ?? '');

            expect(jest.mocked(global.fetch).mock.calls.map(([url]) => url)).toEqual(
                ['/api/info', catalogPath].map(path => expect.stringContaining(path)),
            );
        },
    );

    it('loads nothing for a trade it does not know', async () => {
        await renderUseTradeSectionCatalogs('unknown-order-id');

        expect(global.fetch).not.toHaveBeenCalled();
    });
});
