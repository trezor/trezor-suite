import { tradingBuyActions, tradingExchangeActions } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    adaAsset,
    btc1NormalAccount,
    btcAsset,
} from '@suite-native/trading-fixtures';
import {
    selectBuySelectedReceiveAccount,
    selectExchangeSelectedReceiveAccount,
} from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useReceiveAccountPreselectionEffect } from './useReceiveAccountPreselectionEffect';
import { createTradingLightStore } from '../../../__tests__/tradingTestUtils';

const btc1AccountKey = btc1NormalAccount.key;

describe('useReceiveAccountPreselectionEffect', () => {
    const renderUseReceiveAccountPreselectionEffect = ({
        store,
        tradingType = 'buy',
        receiveAsset = btcAsset,
    }: {
        store: ReturnType<typeof createTradingLightStore>;
        tradingType?: 'buy' | 'exchange';
        receiveAsset?: TradeableAsset;
    }) =>
        renderHookWithStoreProvider(
            () =>
                useReceiveAccountPreselectionEffect({
                    tradingType,
                    receiveAsset,
                    selectReceiveAccount:
                        tradingType === 'buy'
                            ? selectBuySelectedReceiveAccount
                            : selectExchangeSelectedReceiveAccount,
                }),
            { store },
        );

    const createStore = ({
        selectedReceiveAccountKey,
        tradeType = 'buy',
    }: {
        selectedReceiveAccountKey?: AccountKey;
        tradeType?: 'buy' | 'exchange';
    } = {}) =>
        createTradingLightStore({
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

    it('should dispatch buy actions when account is preselected', () => {
        const store = createStore();

        renderUseReceiveAccountPreselectionEffect({ store });

        expect(store.getActions()).toEqual([
            tradingBuyActions.setTradingAccountKey(btc1AccountKey),
            tradingBuyActions.setReceiveAccountKey(btc1AccountKey),
            tradingBuyActions.setReceiveAddress('UNUSED1'),
        ]);
    });

    it('should dispatch exchange actions when account is preselected', () => {
        const store = createStore({ tradeType: 'exchange' });

        renderUseReceiveAccountPreselectionEffect({ store, tradingType: 'exchange' });

        expect(store.getActions()).toEqual([
            tradingExchangeActions.setReceiveAccountKey(btc1AccountKey),
            tradingExchangeActions.setReceiveAddress('UNUSED1'),
        ]);
    });

    it('should not dispatch actions when no preselected account can be found', () => {
        const store = createStore();

        renderUseReceiveAccountPreselectionEffect({ store, receiveAsset: adaAsset });

        expect(store.getActions()).toEqual([]);
    });

    it('should not dispatch actions when selectedReceiveAccount already has account set', () => {
        const store = createStore({ selectedReceiveAccountKey: btc1AccountKey });

        renderUseReceiveAccountPreselectionEffect({ store });

        expect(store.getActions()).toEqual([]);
    });
});
