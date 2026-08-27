import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { tradingExchangeActions } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
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

import { useSendAccountChangeEffect } from './useSendAccountChangeEffect';

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
const btc2Account = getBtcAccount({ descriptor: asAccountDescriptor('btc2legacy') });

describe('useSendAccountChangeEffect', () => {
    let store: TestStore;
    let setValue: jest.Mock;
    let onSendAssetCleared: jest.Mock;

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(getWalletState({ tradeType: 'exchange' }).accounts),
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    const renderUseSendAccountChangeEffect = async () =>
        await renderHookWithStoreProvider(
            () => {
                useSendAccountChangeEffect(
                    setValue,
                    selectExchangeSelectedSendAccount,
                    onSendAssetCleared,
                );
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
        onSendAssetCleared = jest.fn();
    });

    it('should set sendAccount and sendAsset to undefined initially', async () => {
        await renderUseSendAccountChangeEffect();

        expect(setValue).toHaveBeenCalledTimes(2);
        expect(setValue).toHaveBeenCalledWith('sendAccount', undefined);
        expect(setValue).toHaveBeenCalledWith('sendAsset', undefined);
    });

    it('should not fire onSendAssetCleared on initial mount when there was no account', async () => {
        await renderUseSendAccountChangeEffect();

        expect(onSendAssetCleared).not.toHaveBeenCalled();
    });

    it('should fire onSendAssetCleared when a previously selected account disappears', async () => {
        await renderUseSendAccountChangeEffect();
        await act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1Account.key));
        });

        onSendAssetCleared.mockClear();
        await act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(undefined));
        });

        expect(onSendAssetCleared).toHaveBeenCalledTimes(1);
    });

    it('should set sendAccount when account is changed in store', async () => {
        await renderUseSendAccountChangeEffect();

        setValue.mockClear();
        await act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1Account.key));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('sendAccount', btc1Account);
    });

    it('should set sendAsset to undefined when no trading account is selected', async () => {
        await renderUseSendAccountChangeEffect();
        await act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1Account.key));
        });

        setValue.mockClear();
        await act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(undefined));
        });

        expect(setValue).toHaveBeenCalledTimes(2);
        expect(setValue).toHaveBeenCalledWith('sendAccount', undefined);
        expect(setValue).toHaveBeenCalledWith('sendAsset', undefined);
    });

    it('should not change sendAsset when trading account key changed', async () => {
        await renderUseSendAccountChangeEffect();
        await act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1Account.key));
        });

        setValue.mockClear();
        await act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc2Account.key));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('sendAccount', btc2Account);
    });
});
