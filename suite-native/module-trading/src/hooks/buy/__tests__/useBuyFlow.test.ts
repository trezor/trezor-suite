import {
    type PreloadedState,
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import {
    buyQuotes,
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

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

    const getInitializedStore = ({ isLoading }: { isLoading?: boolean }) => {
        const preloadedState: PreloadedState = {
            wallet: { trading: getInitializedTradingStateWithQuotes() },
        };
        if (isLoading !== undefined) {
            preloadedState.wallet!.trading!.buy!.isLoading = isLoading;
        }

        return initStore(preloadedState).store;
    };

    const renderBuyForm = () => renderHookWithStoreProvider(() => useBuyForm(), { store });

    const renderUseTradingBuyFlow = () =>
        renderHookWithStoreProvider(() => useBuyFlow(buyForm), { store });

    describe('while loading quotes', () => {
        beforeEach(() => {
            store = getInitializedStore({ isLoading: true });

            const { result } = renderBuyForm();
            buyForm = result.current;
        });

        it('should canProceed be false when loading', () => {
            const { result } = renderUseTradingBuyFlow();
            expect(result.current.canProceed).toBe(false);
        });
    });

    describe('with quote loaded and selected', () => {
        beforeEach(() => {
            store = getInitializedStore({ isLoading: false });

            const { result } = renderBuyForm();
            buyForm = result.current;

            act(() => {
                buyForm.setValue('quote', buyQuotes[2]);
            });
        });

        it('should canProceed be true when not loading and orderId filters one in quotes', () => {
            const { result } = renderUseTradingBuyFlow();

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

            it('should call nextStep callback with correct address', () => {
                const btcAccount = getBtcAccount();
                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const expectedAddress =
                    btcAccount.addresses?.used?.[0]?.address ?? btcAccount.descriptor;

                const { result } = renderUseTradingBuyFlow();
                dispatchSpy.mockClear();

                act(() => {
                    result.current.selectQuote();
                });

                const dispatchCall = dispatchSpy.mock.calls[0][0] as any;
                const { nextStep } = dispatchCall.payload;

                act(() => {
                    nextStep();
                });

                expect(dispatchSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'confirmTradeThunkMock',
                        payload: expect.objectContaining({
                            address: expectedAddress,
                        }),
                    }),
                );
            });
        });
    });
});
