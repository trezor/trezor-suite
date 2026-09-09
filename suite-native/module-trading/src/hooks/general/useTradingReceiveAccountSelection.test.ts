import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { btc1NormalAccount, btc2legacyAccount } from '@suite-native/trading-fixtures';
import { selectExchangeSelectedReceiveAccount, tradingActions } from '@suite-native/trading-state';

import { useTradingReceiveAccountSelection } from './useTradingReceiveAccountSelection';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';

describe('useTradingReceiveAccountSelection', () => {
    it.each(['buy', 'exchange'] as const)(
        'should select the %s receive account with one action',
        async tradingType => {
            const { actions, dispatch } = createMockDispatch({
                getState: () => undefined,
                extra: undefined,
            });
            const address = btc1NormalAccount.addresses?.unused[0];
            const { result } = await renderHookWithBasicProvider(
                () => useTradingReceiveAccountSelection(tradingType),
                { services: { store: { dispatch } } },
            );

            await act(() => {
                result.current({ account: btc1NormalAccount, address });
            });

            expect(actions).toEqual([
                tradingActions.setReceiveAccount({
                    tradingType,
                    accountKey: btc1NormalAccount.key,
                    address: address?.address,
                }),
            ]);
        },
    );

    it('should not expose a stale address when switching exchange accounts', async () => {
        const store = createTradingTestStore({
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
            { services: { store } },
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
