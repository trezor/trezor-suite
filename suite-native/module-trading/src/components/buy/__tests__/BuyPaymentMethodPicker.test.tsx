import { type EnhancedStore, combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { tradingBuyActions } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { localeInitialState } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedStatePartial,
    act,
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import {
    buyQuotes,
    cexdirectCreditCardBuyQuote,
    getInitializedTradingStateWithQuotes,
    getWalletState,
} from '@suite-native/trading-fixtures';
import { tradingSlice } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';
import { mergeDeepObject } from '@trezor/utils';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyPaymentMethodPicker } from '../BuyPaymentMethodPicker';

const reportMock = jest.fn();

describe('BuyPaymentMethodPicker', () => {
    let form: BuyFormType;
    const defaultPreloadedState = {
        locale: localeInitialState,
        wallet: getWalletState({ tradeType: 'buy' }),
    };

    const reducer = {
        locale: createStaticReducer(localeInitialState),
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(getWalletState({ tradeType: 'buy' }).accounts),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
        }),
    } as const;

    const renderPaymentMethodPicker = (
        componentPreloadedState: PreloadedStatePartial<typeof defaultPreloadedState> = {},
        store?: EnhancedStore,
        formPreloadedState: PreloadedStatePartial<
            typeof defaultPreloadedState
        > = defaultPreloadedState,
    ) => {
        const mergedFormPreloadedState = mergeDeepObject(defaultPreloadedState, formPreloadedState);
        const mergedComponentPreloadedState = mergeDeepObject(
            defaultPreloadedState,
            componentPreloadedState,
        );

        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState: mergedFormPreloadedState,
            store,
            providers: ['intl', 'navigation', 'formatter'],
        });
        form = result.current;

        return renderWithStoreProvider(
            <Form form={form}>
                <BuyPaymentMethodPicker />
            </Form>,
            {
                preloadedState: mergedComponentPreloadedState,
                store,
                providers: ['intl', 'navigation', 'formatter'],
            },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should not render when there are no payment methods', () => {
        const { toJSON } = renderPaymentMethodPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader when loading initial quotes', () => {
        const preloadedState = {
            wallet: { trading: { buy: { isLoading: true, quotes: [] } } },
        } satisfies PreloadedStatePartial<typeof defaultPreloadedState>;

        const { getByLabelText } = renderPaymentMethodPicker(preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        const withQuotes: PreloadedStatePartial<typeof defaultPreloadedState> = {
            wallet: { trading: getInitializedTradingStateWithQuotes() },
        };

        it('should display "Not selected" when no method is selected in form', () => {
            const { getByLabelText } = renderPaymentMethodPicker(withQuotes);
            expect(getByLabelText('No payment method selected')).toHaveTextContent('Not selected');
        });

        it('should allow to select payment method', () => {
            const { getByText, getByLabelText } = renderPaymentMethodPicker(withQuotes);

            fireEvent.press(getByText('Payment method'));
            fireEvent.press(getByText('Credit Card'));

            expect(getByLabelText('Selected payment method')).toHaveTextContent('Credit Card');
        });

        it('should display loader while quotes are fetched', () => {
            const { getByLabelText } = renderPaymentMethodPicker(
                mergeDeepObject(withQuotes, {
                    wallet: { trading: { buy: { isLoading: true } } },
                }),
            );

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', () => {
            const store = createLightStore({
                reducer,
                preloadedState: {
                    wallet: {
                        trading: getWalletState({ tradeType: 'buy' }).trading,
                    },
                },
            });
            store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
            const { getByText } = renderPaymentMethodPicker(undefined, store);

            fireEvent.press(getByText('Payment method'));
            act(() => {
                store.dispatch(tradingBuyActions.setIsLoading(true));
            });

            expect(getByText('Credit Card')).toBeOnTheScreen();
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on payment method select', () => {
                const { getByText } = renderPaymentMethodPicker(withQuotes);

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getByText('Credit Card'));

                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'buy',
                        parameter: 'paymentMethod',
                    },
                });
            });

            it('should fire analytics event on payment method change', () => {
                const { getByText } = renderPaymentMethodPicker(withQuotes);

                act(() => {
                    form.setValue('quote', cexdirectCreditCardBuyQuote);
                });

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getByText('Apple Pay'));

                expect(reportMock).toHaveBeenCalledTimes(1);
            });

            it('should not fire analytics event when same payment method is selected', () => {
                const { getByText, getAllByText } = renderPaymentMethodPicker(withQuotes);

                act(() => {
                    form.setValue('quote', cexdirectCreditCardBuyQuote);
                });

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getAllByText('Credit Card')[1]);

                expect(reportMock).toHaveBeenCalledTimes(0);
            });
        });
    });
});
