import { type Store } from '@reduxjs/toolkit';

import { tradingSellActions } from '@suite-common/trading';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { act, renderHookWithStoreProvider, waitFor } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { useSellForm } from './useSellForm';
import { useSellSelectQuote } from './useSellSelectQuote';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState;

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    sellThunks: {
        selectQuoteThunk: (args: any) => args,
    },
}));

describe('useSellSelectQuote', () => {
    let store: Store<State>;

    const renderUseSellSelectQuote = async () =>
        await renderHookWithStoreProvider(
            () => {
                const form = useSellForm();

                return { form, ...useSellSelectQuote(form) };
            },
            { services: { store } },
        );

    beforeEach(() => {
        store = createTradingTestStore({ tradeType: 'sell' });
    });

    describe('canProceed', () => {
        it('should be false when no quote is selected in form', async () => {
            const { result } = await renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when quotes are being fetched', async () => {
            const { result } = await renderUseSellSelectQuote();

            await act(() => {
                result.current.form.setValue('quote', banxaCreditCardSellQuote);
                store.dispatch(tradingSellActions.setIsLoading(true));
            });

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when form contains error', async () => {
            const { result, rerender } = await renderUseSellSelectQuote();
            const { form } = result.current;
            form.register('cryptoStringAmount');

            await act(() => {
                store.dispatch(
                    tradingSellActions.setTradingAccountKey(
                        mockAccountKey({ symbol: 'btc', descriptor: 'btc1normal' }),
                    ),
                );
                form.setValue('quote', banxaCreditCardSellQuote);
            });

            await act(async () => {
                form.setValue('cryptoStringAmount', '-1', { shouldValidate: true });
                await form.trigger('cryptoStringAmount');
            });
            await rerender(undefined);

            await waitFor(() => expect(result.current.canProceed).toEqual(false));
        });

        it('should be true when quote is selected', async () => {
            const { result } = await renderUseSellSelectQuote();

            await act(() => {
                result.current.form.setValue('quote', banxaCreditCardSellQuote);
                store.dispatch(
                    tradingSellActions.setTradingAccountKey(
                        mockAccountKey({ symbol: 'btc', descriptor: 'btc1normal' }),
                    ),
                );
            });

            expect(result.current.canProceed).toEqual(true);
        });
    });
});
