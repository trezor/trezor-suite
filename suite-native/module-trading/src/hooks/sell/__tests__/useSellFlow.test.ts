import { tradingSellActions } from '@suite-common/trading';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { sellQuotes } from '../../../__fixtures__/sellQuotes';
import { getWalletState } from '../../../__fixtures__/walletState';
import { SellFormType } from '../../../types/sell';
import { useSellFlow } from '../useSellFlow';
import { useSellForm } from '../useSellForm';

describe('useSellFlow', () => {
    let store: TestStore;
    let sellForm: SellFormType;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm(), { store });

    const renderUseSellFlow = () =>
        renderHookWithStoreProviderAsync(() => useSellFlow(sellForm), { store });

    beforeEach(async () => {
        store = await initStore({ wallet: getWalletState({ tradeType: 'sell' }) });

        const { result } = await renderSellForm();
        sellForm = result.current;
    });

    describe('canProceed', () => {
        it('should be false when no quote is selected in form', async () => {
            const { result } = await renderUseSellFlow();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be false when quotes are being fetched', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
                store.dispatch(tradingSellActions.setIsLoading(true));
            });

            const { result } = await renderUseSellFlow();

            expect(result.current.canProceed).toEqual(false);
        });

        it('should be true when quote is selected', async () => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
            });

            const { result } = await renderUseSellFlow();

            expect(result.current.canProceed).toEqual(true);
        });
    });

    describe('selectQuote', () => {
        it('should do nothing when no quote is selected', async () => {
            const { result } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            expect(result.current.isConsentRequested).toEqual(false);
        });

        it('should request consent', async () => {
            // TODO this is a temporary solution (will be changed with proper flow implementation)
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
            });
            const { result } = await renderUseSellFlow();

            act(() => {
                result.current.selectQuote();
            });

            expect(result.current.isConsentRequested).toEqual(true);
        });
    });

    describe('giveConsent', () => {
        beforeEach(() => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
            });
        });

        it('should resolve consent', async () => {
            const { result } = await renderUseSellFlow();
            act(() => {
                result.current.selectQuote();
            });

            act(() => {
                result.current.giveConsent();
            });

            expect(result.current.isConsentRequested).toEqual(false);
        });
    });

    describe('cancelConsent', () => {
        beforeEach(() => {
            act(() => {
                sellForm.setValue('quote', sellQuotes[0]);
            });
        });

        it('should resolve consent (with false value)', async () => {
            const { result } = await renderUseSellFlow();
            act(() => {
                result.current.selectQuote();
            });

            act(() => {
                result.current.cancelConsent();
            });

            expect(result.current.isConsentRequested).toEqual(false);
        });

        it('should reset consent when quote provider changes', async () => {
            const { result, rerender } = await renderUseSellFlow();
            act(() => {
                result.current.selectQuote();
            });

            act(() => {
                sellForm.setValue('quote', { ...sellQuotes, exchange: 'invity-sell' });
            });
            rerender({});

            expect(result.current.isConsentRequested).toEqual(false);
        });
    });
});
