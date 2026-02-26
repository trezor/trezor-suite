import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    PreloadedState,
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import {
    buyQuotes,
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';
import { BuyFormType } from '@suite-native/trading-types';

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
                buyForm.setValue('quote', buyQuotes[2]);
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

            it('should call nextStep callback with correct address', async () => {
                const btcAccount = getBtcAccount();
                const dispatchSpy = jest.spyOn(store, 'dispatch');
                const expectedAddress =
                    btcAccount.addresses?.used?.[0]?.address ?? btcAccount.descriptor;

                const { result } = await renderUseTradingBuyFlow();
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
