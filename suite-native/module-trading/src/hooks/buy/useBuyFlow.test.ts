import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
    invityErrorBuyQuote,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyFlow } from './useBuyFlow';
import { useBuyForm } from './useBuyForm';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

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

    const renderBuyForm = async () =>
        await renderHookWithStoreProvider(() => useBuyForm(), { store });

    const renderUseTradingBuyFlow = async () =>
        await renderHookWithStoreProvider(() => useBuyFlow(buyForm), { store });

    describe('while loading quotes', () => {
        beforeEach(async () => {
            store = getInitializedStore({ isLoading: true });

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
            store = getInitializedStore({ isLoading: false });

            const { result } = await renderBuyForm();
            buyForm = result.current;

            await act(() => {
                buyForm.setValue('quote', invityErrorBuyQuote);
            });
        });

        it('should canProceed be true when not loading and orderId filters one in quotes', async () => {
            const { result } = await renderUseTradingBuyFlow();

            expect(result.current.canProceed).toBe(true);
        });

        describe('and receive account selected', () => {
            beforeEach(async () => {
                const btcAccount = getBtcAccount();
                await act(() => {
                    buyForm.setValue('receiveAccount', {
                        account: btcAccount,
                        address: btcAccount.addresses?.used?.[0],
                    });
                });
            });

            it('should store receive address and account key in Redux before navigating to preview', async () => {
                const btcAccount = getBtcAccount();
                const expectedAddress =
                    btcAccount.addresses?.used?.[0]?.address ?? btcAccount.descriptor;

                const { result } = await renderUseTradingBuyFlow();

                await act(() => {
                    result.current.selectQuote();
                });

                const state = store.getState();
                expect(state.wallet.trading.buy.receiveAddress).toBe(expectedAddress);
                expect(state.wallet.trading.buy.receiveAccountKey).toBe(btcAccount.key);
            });

            it('should reset form when navigating to preview', async () => {
                const { result } = await renderUseTradingBuyFlow();
                const resetSpy = jest.spyOn(buyForm, 'reset');

                await act(() => {
                    result.current.selectQuote();
                });

                const [payload] = mockSelectQuoteThunk.mock.calls[0] as [any];

                await act(() => {
                    payload.nextStep();
                });

                expect(resetSpy).toHaveBeenCalledTimes(1);
            });
        });
    });
});
