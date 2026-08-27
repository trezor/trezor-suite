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
import { selectExchangeSelectedReceiveAccount, tradingSlice } from '@suite-native/trading-state';

import { useReceiveAccountChangeEffect } from './useReceiveAccountChangeEffect';

describe('useReceiveAccountChangeEffect', () => {
    let store: TestStore;
    let setValue: jest.Mock;

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

    const renderUseReceiveAccountChangeEffect = async () =>
        await renderHookWithStoreProvider(
            () => useReceiveAccountChangeEffect(setValue, selectExchangeSelectedReceiveAccount),
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

    it('should set receiveAccount based on store value', async () => {
        await renderUseReceiveAccountChangeEffect();

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('receiveAccount', undefined);
    });

    it('should set receiveAccount on change', async () => {
        const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
        await renderUseReceiveAccountChangeEffect();

        setValue.mockClear();
        await act(() => {
            store.dispatch(tradingExchangeActions.setReceiveAccountKey(btc1Account.key));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('receiveAccount', {
            account: btc1Account,
            address: undefined,
        });
    });
});
