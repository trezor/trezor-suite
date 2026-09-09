import { type Store, combineReducers } from '@reduxjs/toolkit';
import type { CryptoId } from 'invity-api';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { tradingActions } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, getWalletState, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradingRootState, tradingSlice } from '@suite-native/trading-state';

import { useTradeableAssetValidityEffect } from './useTradeableAssetValidityEffect';

type State = TradingRootState;

describe('useTradeableAssetValidityEffect', () => {
    let store: Store<State>;
    let setValue: jest.Mock;

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer([]),
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    const renderEffect = async (cryptoId: CryptoId | undefined) =>
        await renderHookWithStoreProvider(
            () => useTradeableAssetValidityEffect(setValue, cryptoId),
            { services: { store } },
        );

    beforeEach(() => {
        store = createLightStore({
            reducer,
            preloadedState: {
                wallet: {
                    trading: getWalletState({ tradeType: 'buy' }).trading,
                },
            },
        });
        setValue = jest.fn();
    });

    it('should not clear asset when cryptoId is still present in coins', async () => {
        await renderEffect(btcAsset.cryptoId);

        expect(setValue).not.toHaveBeenCalled();
    });

    it('should clear asset when cryptoId is no longer present in coins', async () => {
        await renderEffect(usdcAsset.cryptoId);
        expect(setValue).not.toHaveBeenCalled();

        await act(() => {
            const { coins, platforms } = store.getState().wallet.trading.info;
            store.dispatch(
                tradingActions.saveInfo({
                    coins: {
                        bitcoin: coins!.bitcoin!,
                    },
                    platforms: platforms!,
                    config: {},
                }),
            );
        });

        expect(setValue).toHaveBeenCalledWith('asset', undefined);
    });

    it('should not clear asset while coins catalog is empty', async () => {
        store = createLightStore({
            reducer,
            preloadedState: {
                wallet: {
                    trading: {
                        ...getWalletState({ tradeType: 'buy' }).trading,
                        info: { coins: {}, platforms: {} },
                    },
                },
            },
        });

        await renderEffect(btcAsset.cryptoId);

        expect(setValue).not.toHaveBeenCalled();
    });
});
