import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
    invityErrorBuyQuote,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyFlow } from './useBuyFlow';
import { useBuyForm } from './useBuyForm';
import { createTradingLightStore } from '../../__tests__/tradingTestUtils';

const mockSelectQuoteThunk = jest.fn();

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    buyThunks: {
        selectQuoteThunk: (payload: unknown) => {
            mockSelectQuoteThunk(payload);

            // Return a thunk so redux-thunk intercepts it before the serializable check middleware
            return () => Promise.resolve();
        },
    },
}));

describe('useBuyFlow', () => {
    let buyForm: BuyFormType;
    let store: TestStore;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const getInitializedStore = ({ isLoading }: { isLoading?: boolean }) =>
        createTradingLightStore({
            tradeType: 'buy',
            overrides: {
                wallet: {
                    trading: {
                        ...getInitializedTradingStateWithQuotes(),
                        ...(isLoading !== undefined && { buy: { isLoading } }),
                    },
                },
            },
        });

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
                buyForm.setValue('quote', invityErrorBuyQuote);
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

            it('should store receive address and account key in Redux before navigating to preview', () => {
                const btcAccount = getBtcAccount();
                const expectedAddress =
                    btcAccount.addresses?.used?.[0]?.address ?? btcAccount.descriptor;

                const { result } = renderUseTradingBuyFlow();

                act(() => {
                    result.current.selectQuote();
                });

                const state = store.getState();
                expect(state.wallet.trading.buy.receiveAddress).toBe(expectedAddress);
                expect(state.wallet.trading.buy.receiveAccountKey).toBe(btcAccount.key);
            });

            it('should reset form when navigating to preview', () => {
                const { result } = renderUseTradingBuyFlow();
                const resetSpy = jest.spyOn(buyForm, 'reset');

                act(() => {
                    result.current.selectQuote();
                });

                const [payload] = mockSelectQuoteThunk.mock.calls[0] as [any];

                act(() => {
                    payload.nextStep();
                });

                expect(resetSpy).toHaveBeenCalledTimes(1);
            });
        });
    });
});
