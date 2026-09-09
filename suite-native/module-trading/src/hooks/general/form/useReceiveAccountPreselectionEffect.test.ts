import { type Store } from '@reduxjs/toolkit';

import { type AccountKey } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    adaAsset,
    btc1NormalAccount,
    btcAsset,
} from '@suite-native/trading-fixtures';
import {
    type CombinedSelectorsRootState,
    type TradingRootState,
    selectBuySelectedReceiveAccount,
    selectExchangeSelectedReceiveAccount,
    tradingActions,
} from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useReceiveAccountPreselectionEffect } from './useReceiveAccountPreselectionEffect';
import { createTradingTestStore } from '../../../test-utils/tradingTestUtils';

type State = TradingRootState & CombinedSelectorsRootState;

const btc1AccountKey = btc1NormalAccount.key;

describe('useReceiveAccountPreselectionEffect', () => {
    const renderUseReceiveAccountPreselectionEffect = async ({
        store,
        tradingType = 'buy',
        receiveAsset = btcAsset,
    }: {
        store: Store<State>;
        tradingType?: 'buy' | 'exchange';
        receiveAsset?: TradeableAsset;
    }) =>
        await renderHookWithStoreProvider(
            () =>
                useReceiveAccountPreselectionEffect({
                    tradingType,
                    receiveAsset,
                    selectReceiveAccount:
                        tradingType === 'buy'
                            ? selectBuySelectedReceiveAccount
                            : selectExchangeSelectedReceiveAccount,
                }),
            { services: { store } },
        );

    const createStore = ({
        selectedReceiveAccountKey,
        tradeType = 'buy',
    }: {
        selectedReceiveAccountKey?: AccountKey;
        tradeType?: 'buy' | 'exchange';
    } = {}) =>
        createTradingTestStore({
            tradeType,
            overrides: {
                device: {
                    selectedDevice: {
                        state: {
                            staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID,
                        },
                    },
                },
                wallet: {
                    accounts: [btc1NormalAccount],
                    trading: {
                        [tradeType]: {
                            ...(tradeType === 'buy'
                                ? { tradingAccountKey: selectedReceiveAccountKey }
                                : { receiveAccountKey: selectedReceiveAccountKey }),
                        },
                    },
                },
            },
        });

    it('should dispatch buy actions when account is preselected', async () => {
        const store = createStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        await renderUseReceiveAccountPreselectionEffect({ store });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingActions.setReceiveAccount({
                tradingType: 'buy',
                accountKey: btc1AccountKey,
                address: 'UNUSED1',
            }),
        );
    });

    it('should dispatch exchange actions when account is preselected', async () => {
        const store = createStore({ tradeType: 'exchange' });
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        await renderUseReceiveAccountPreselectionEffect({ store, tradingType: 'exchange' });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingActions.setReceiveAccount({
                tradingType: 'exchange',
                accountKey: btc1AccountKey,
                address: 'UNUSED1',
            }),
        );
    });

    it('should not dispatch actions when no preselected account can be found', async () => {
        const store = createStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        await renderUseReceiveAccountPreselectionEffect({ store, receiveAsset: adaAsset });

        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should not dispatch actions when selectedReceiveAccount already has account set', async () => {
        const store = createStore({ selectedReceiveAccountKey: btc1AccountKey });
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        await renderUseReceiveAccountPreselectionEffect({ store });

        expect(dispatchSpy).not.toHaveBeenCalled();
    });
});
