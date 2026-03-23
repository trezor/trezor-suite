import { tradingSellActions } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../useSellForm';
import { useSellSelectQuote } from '../useSellSelectQuote';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    sellThunks: {
        selectQuoteThunk: (args: any) => args,
    },
}));

describe('useSellSelectQuote', () => {
    let store: TestStore;
    let sellForm: SellFormType;

    const renderSellForm = () => renderHookWithStoreProvider(() => useSellForm(), { store });

    const renderUseSellSelectQuote = () =>
        renderHookWithStoreProvider(() => useSellSelectQuote(sellForm), { store });

    beforeEach(() => {
        store = initStore({ wallet: getWalletState({ tradeType: 'sell' }) }).store;

        const { result } = renderSellForm();
        sellForm = result.current;
    });

    describe('canProceed', () => {
        it('should be false when no quote is selected in form', () => {
            const { result } = renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when quotes are being fetched', () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(tradingSellActions.setIsLoading(true));
            });

            const { result } = renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when form contains error', () => {
            act(() => {
                store.dispatch(
                    tradingSellActions.setTradingAccountKey(
                        'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                );
                sellForm.setValue('quote', sellQuotes[0]);
                sellForm.setError('cryptoStringAmount', {
                    type: 'manual',
                    message: 'VALIDATION_ERROR',
                });
            });

            const { result } = renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be true when quote is selected', () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(
                    tradingSellActions.setTradingAccountKey(
                        'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                );
            });

            const { result } = renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(true);
        });
    });
});
