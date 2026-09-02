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
    tradingActions,
} from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useReceiveAccountPreselectionEffect } from './useReceiveAccountPreselectionEffect';
import { createTradingLightStore } from '../../../test-utils/tradingTestUtils';

const btc1AccountKey = btc1NormalAccount.key;

describe('useReceiveAccountPreselectionEffect', () => {
    const renderUseReceiveAccountPreselectionEffect = async ({
        store,
        tradingType = 'buy',
        receiveAsset = btcAsset,
    }: {
        store: ReturnType<typeof createTradingLightStore>;
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

    it('should dispatch buy actions when account is preselected', async () => {
        const store = createStore();

        await renderUseReceiveAccountPreselectionEffect({ store });

        expect(store.getActions()).toEqual([
            tradingActions.setReceiveAccount({
                tradingType: 'buy',
                accountKey: btc1AccountKey,
                address: 'UNUSED1',
            }),
        ]);
    });

    it('should dispatch exchange actions when account is preselected', async () => {
        const store = createStore({ tradeType: 'exchange' });

        await renderUseReceiveAccountPreselectionEffect({ store, tradingType: 'exchange' });

        expect(store.getActions()).toEqual([
            tradingActions.setReceiveAccount({
                tradingType: 'exchange',
                accountKey: btc1AccountKey,
                address: 'UNUSED1',
            }),
        ]);
    });

    it('should not dispatch actions when no preselected account can be found', async () => {
        const store = createStore();

        await renderUseReceiveAccountPreselectionEffect({ store, receiveAsset: adaAsset });

        expect(store.getActions()).toEqual([]);
    });

    it('should not dispatch actions when selectedReceiveAccount already has account set', async () => {
        const store = createStore({ selectedReceiveAccountKey: btc1AccountKey });

        await renderUseReceiveAccountPreselectionEffect({ store });

        expect(store.getActions()).toEqual([]);
    });
});
