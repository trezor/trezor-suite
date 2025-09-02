import { BuyTrade } from 'invity-api';

import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import quotes from '../../../__fixtures__/buyQuotes.json';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { BuyFormType } from '../../../types/buy';
import { useBuyFlow } from '../useBuyFlow';
import { useBuyForm } from '../useBuyForm';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    buyThunks: {
        selectQuoteThunk: (payload: unknown) => ({
            type: 'selectQuoteThunkMock',
            payload,
        }),
        confirmTradeThunk: (payload: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload,
        }),
    },
}));

describe('useBuyFlow', () => {
    let buyForm: BuyFormType;
    let store: TestStore;

    const getInitializedStore = async ({ isLoading }: { isLoading?: boolean }) => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: getInitializedTradingStateWithQuotes() },
        };
        if (isLoading !== undefined) {
            preloadedState.wallet!.tradingNew!.buy!.isLoading = isLoading;
        }

        return await initStore(preloadedState);
    };

    const renderBuyForm = () => renderHookWithStoreProviderAsync(() => useBuyForm(), { store });

    const renderUseTradingBuyFlow = () =>
        renderHookWithStoreProviderAsync(() => useBuyFlow(buyForm), { store });

    describe('while loading quotes', () => {
        beforeEach(async () => {
            store = await getInitializedStore({ isLoading: true });

            const { result } = await renderBuyForm();
            buyForm = result.current;
        });

        it('should canProceed be false when loading', async () => {
            const { result } = await renderUseTradingBuyFlow();
            expect(result.current.canProceed).toBe(false);
        });
    });

    describe('with quote loaded and selected', () => {
        beforeEach(async () => {
            store = await getInitializedStore({ isLoading: false });

            const { result } = await renderBuyForm();
            buyForm = result.current;

            act(() => {
                buyForm.setValue('quote', quotes[2] as BuyTrade);
            });
        });

        it('should canProceed be true when not loading and orderId filters one in quotes', async () => {
            const { result } = await renderUseTradingBuyFlow();

            expect(result.current.canProceed).toBe(true);
        });

        describe('and receive account selected', () => {
            beforeEach(() => {
                const btcAccount = getBtcAccount();
                act(() => {
                    buyForm.setValue('receiveAccount', {
                        account: btcAccount,
                        address: btcAccount.addresses?.used?.[0],
                    });
                });
            });

            it('should handle user consent flow', async () => {
                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const { result } = await renderUseTradingBuyFlow();

                act(() => {
                    result.current.selectQuote();
                });

                const dispatchCall = dispatchSpy.mock.calls[0][0];
                const { userConsent } = dispatchCall.payload;

                act(() => {
                    userConsent('provider', 'BTC');
                });

                expect(result.current.isConsentRequested).toBe(true);

                act(() => {
                    result.current.giveConsent();
                });

                expect(result.current.isConsentRequested).toBe(false);
            });

            it('should call nextStep callback with correct address', async () => {
                const btcAccount = getBtcAccount();
                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const expectedAddress =
                    btcAccount.addresses?.used?.[0]?.address ?? btcAccount.descriptor;

                const { result } = await renderUseTradingBuyFlow();

                act(() => {
                    result.current.selectQuote();
                });

                const dispatchCall = dispatchSpy.mock.calls[0][0];
                const { nextStep } = dispatchCall.payload;

                act(() => {
                    nextStep();
                });

                expect(store.dispatch).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'confirmTradeThunkMock',
                        payload: expect.objectContaining({
                            address: expectedAddress,
                        }),
                    }),
                );
            });

            it('should call cancelConsent when quote provider changes', async () => {
                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const { result, rerender } = await renderUseTradingBuyFlow();

                act(() => {
                    result.current.selectQuote();
                });

                const dispatchCall = dispatchSpy.mock.calls[0][0];
                // simulate userConsent call (as we mock the thunk)
                const { userConsent } = dispatchCall.payload;
                act(() => {
                    userConsent();
                });
                expect(result.current.isConsentRequested).toBe(true);

                // change selected quote to quote with different provider
                act(() => {
                    buyForm.setValue('quote', { ...quotes[2], exchange: 'invity-buy' } as BuyTrade);
                });

                // we need to manually rerender tested hook
                rerender({});

                // consent should not be requested anymore
                expect(result.current.isConsentRequested).toBe(false);
            });
        });
    });
});
