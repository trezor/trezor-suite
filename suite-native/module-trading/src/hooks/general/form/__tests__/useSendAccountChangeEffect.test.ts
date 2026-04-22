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
import { selectExchangeSelectedSendAccount, tradingSlice } from '@suite-native/trading-state';

import { useSendAccountChangeEffect } from '../useSendAccountChangeEffect';

const btc1AccountKey = 'btc-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc2AccountKey = 'btc-account-2' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useSendAccountChangeEffect', () => {
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

    const renderUseSendAccountChangeEffect = () =>
        renderHookWithStoreProvider(
            () => {
                useSendAccountChangeEffect(setValue, selectExchangeSelectedSendAccount);
            },
            { store },
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

    it('should set sendAccount and sendAsset to undefined initially', () => {
        renderUseSendAccountChangeEffect();

        expect(setValue).toHaveBeenCalledTimes(2);
        expect(setValue).toHaveBeenCalledWith('sendAccount', undefined);
        expect(setValue).toHaveBeenCalledWith('sendAsset', undefined);
    });

    it('should set sendAccount when account is changed in store', () => {
        renderUseSendAccountChangeEffect();

        setValue.mockClear();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('sendAccount', getBtcAccount(btc1AccountKey));
    });

    it('should set sendAsset to undefined when no trading account is selected', () => {
        renderUseSendAccountChangeEffect();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
        });

        setValue.mockClear();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(undefined));
        });

        expect(setValue).toHaveBeenCalledTimes(2);
        expect(setValue).toHaveBeenCalledWith('sendAccount', undefined);
        expect(setValue).toHaveBeenCalledWith('sendAsset', undefined);
    });

    it('should not change sendAsset when trading account key changed', () => {
        renderUseSendAccountChangeEffect();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
        });

        setValue.mockClear();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc2AccountKey));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('sendAccount', getBtcAccount(btc2AccountKey));
    });
});
