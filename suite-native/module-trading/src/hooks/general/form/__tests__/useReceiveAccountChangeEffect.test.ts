import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { tradingExchangeActions } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { selectExchangeSelectedReceiveAccount, tradingSlice } from '@suite-native/trading-state';

import { useReceiveAccountChangeEffect } from '../useReceiveAccountChangeEffect';

describe('useReceiveAccountChangeEffect', () => {
    let store: TestStore;
    let setValue: jest.Mock;

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(getWalletState({ tradeType: 'exchange' }).accounts),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
        }),
    } as const;

    const renderUseReceiveAccountChangeEffect = () =>
        renderHookWithStoreProvider(
            () => useReceiveAccountChangeEffect(setValue, selectExchangeSelectedReceiveAccount),
            { store, providers: [] },
        );

    beforeEach(() => {
        store = createLightStore({
            reducer,
            preloadedState: {
                wallet: {
                    trading: getWalletState({ tradeType: 'exchange' }).trading,
                },
            },
        });
        setValue = jest.fn();
    });

    it('should set receiveAccount based on store value', () => {
        renderUseReceiveAccountChangeEffect();

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('receiveAccount', undefined);
    });

    it('should set receiveAccount on change', () => {
        renderUseReceiveAccountChangeEffect();

        setValue.mockClear();
        act(() => {
            store.dispatch(
                tradingExchangeActions.setReceiveAccountKey(
                    'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            );
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('receiveAccount', {
            account: getBtcAccount(
                'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
            ),
            address: undefined,
        });
    });
});
