import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { selectIsAmountInputActive, tradingSlice } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';

import { useFocusedValueWatch } from './useFocusedValueWatch';
import { useBuyForm } from '../buy/useBuyForm';

jest.mock('./useFocusedValueWatch', () => jest.requireActual('./useFocusedValueWatch'));

describe('useFocusedValueWatch', () => {
    let form: BuyFormType;
    let store: TestStore;

    const reducer = {
        device: createStaticReducer(deviceInitialState),
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(getWalletState({ tradeType: 'buy' }).accounts),
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    const preloadedState = {
        device: deviceInitialState,
        wallet: {
            trading: getWalletState({ tradeType: 'buy' }).trading,
        },
    };

    const renderForm = async () =>
        await renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
        });

    const renderUseFocusedValueWatch = async () =>
        await renderHookWithStoreProvider(({ control }) => useFocusedValueWatch(control), {
            initialProps: { control: form.control },
            store,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;

        store = createLightStore({ reducer, preloadedState });
    });

    it('should return false by default', async () => {
        const { result } = await renderUseFocusedValueWatch();

        expect(result.current).toEqual(false);
        expect(selectIsAmountInputActive(store.getState())).toBe(false);
    });

    it('should be false right after input is focused', async () => {
        const { result } = await renderUseFocusedValueWatch();

        await act(() => {
            form.setValue('focusedValue', 'fiatValue');
        });

        // make sure state is updated
        await act(() => Promise.resolve());

        expect(result.current).toEqual(false);
        expect(selectIsAmountInputActive(store.getState())).toBe(false);
    });

    it('should be true after 300ms of input focus', async () => {
        const { result } = await renderUseFocusedValueWatch();

        await act(() => {
            form.setValue('focusedValue', 'fiatValue');
        });
        await act(async () => {
            // temporary: find the proper async timer handling
            // https://github.com/trezor/trezor-suite/issues/19553
            await new Promise(resolve => setTimeout(resolve, 300));
        });

        expect(result.current).toEqual(true);
        expect(selectIsAmountInputActive(store.getState())).toBe(true);
    });

    it('should set isAmountInputActive to false on unmount', async () => {
        const { unmount } = await renderUseFocusedValueWatch();
        await act(() => {
            form.setValue('focusedValue', 'fiatValue');
        });
        await act(async () => {
            // temporary: find the proper async timer handling
            // https://github.com/trezor/trezor-suite/issues/19553
            await new Promise(resolve => setTimeout(resolve, 300));
        });

        await unmount();

        expect(selectIsAmountInputActive(store.getState())).toBe(false);
    });
});
