import { tradingSellActions } from '@suite-common/trading';
import { AccountKey } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils';
import { type TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';
import { SellFormType } from '@suite-native/trading-types';

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

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm(), { store });

    const renderUseSellSelectQuote = () =>
        renderHookWithStoreProviderAsync(() => useSellSelectQuote(sellForm), { store });

    beforeEach(async () => {
        store = initStore({ wallet: getWalletState({ tradeType: 'sell' }) }).store;

        const { result } = await renderSellForm();
        sellForm = result.current;
    });

    describe('canProceed', () => {
        it('should be false when no quote is selected in form', async () => {
            const { result } = await renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when quotes are being fetched', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(tradingSellActions.setIsLoading(true));
            });

            const { result } = await renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when form contains error', async () => {
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

            const { result } = await renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be true when quote is selected', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(
                    tradingSellActions.setTradingAccountKey(
                        'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    ),
                );
            });

            const { result } = await renderUseSellSelectQuote();

            expect(result.current.canProceed).toEqual(true);
        });
    });
});
