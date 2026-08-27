import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { btc1NormalAccount, btc2legacyAccount } from '@suite-native/trading-fixtures';
import { selectExchangeSelectedReceiveAccount, tradingActions } from '@suite-native/trading-state';

import { useTradingReceiveAccountSelection } from './useTradingReceiveAccountSelection';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

describe('useTradingReceiveAccountSelection', () => {
    it.each(['buy', 'exchange'] as const)(
        'should select the %s receive account with one action',
        async tradingType => {
            const store = createTradingLightStore({ tradeType: tradingType });
            const address = btc1NormalAccount.addresses?.unused[0];
            const { result } = await renderHookWithStoreProvider(
                () => useTradingReceiveAccountSelection(tradingType),
                { store },
            );

            await act(() => {
                result.current({ account: btc1NormalAccount, address });
            });

            expect(store.getActions()).toEqual([
                tradingActions.setReceiveAccount({
                    tradingType,
                    accountKey: btc1NormalAccount.key,
                    address: address?.address,
                }),
            ]);
        },
    );

    it('should not expose a stale address when switching exchange accounts', async () => {
        const store = createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    accounts: [btc1NormalAccount, btc2legacyAccount],
                    trading: {
                        exchange: {
                            receiveAccountKey: btc1NormalAccount.key,
                            receiveAddress: 'UNUSED1',
                        },
                    },
                },
            },
        });
        const selectReceiveAccount = jest.fn(() =>
            selectExchangeSelectedReceiveAccount(store.getState()),
        );
        const unsubscribe = store.subscribe(selectReceiveAccount);
        const { result } = await renderHookWithStoreProvider(
            () => useTradingReceiveAccountSelection('exchange'),
            { store },
        );

        expect(async () => {
            await act(() => {
                result.current({ account: btc2legacyAccount });
            });
        }).not.toThrow();
        expect(selectReceiveAccount).toHaveBeenCalledTimes(1);
        expect(selectExchangeSelectedReceiveAccount(store.getState())).toEqual({
            account: btc2legacyAccount,
        });

        unsubscribe();
    });
});
