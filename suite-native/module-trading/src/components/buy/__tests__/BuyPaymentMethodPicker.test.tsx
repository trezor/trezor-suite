import { type EnhancedStore, combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { tradingBuyActions } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation, localeInitialState } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
    act,
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
    within,
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
const creditCardPaymentMethodTranslation = getTranslation(
    'moduleTrading.paymentMethods.creditCard',
);
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('BuyPaymentMethodPicker', () => {
    let form: BuyFormType;
    const defaultPreloadedState = {
        device: deviceInitialState,
        locale: localeInitialState,
        wallet: getWalletState({ tradeType: 'buy' }),
    };

    const reducer = {
        device: createStaticReducer(deviceInitialState),
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
            services,
            store,
        });
        form = result.current;

        return renderWithStoreProvider(
            <Form form={form}>
                <BuyPaymentMethodPicker />
            </Form>,
            { preloadedState: mergedComponentPreloadedState, services, store },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
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

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
        ).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        const withQuotes: PreloadedStatePartial<typeof defaultPreloadedState> = {
            wallet: { trading: getInitializedTradingStateWithQuotes() },
        };

        it('should display "Not selected" when no method is selected in form', () => {
            const { getByLabelText } = renderPaymentMethodPicker(withQuotes);
            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.noPaymentMethod')),
            ).toHaveTextContent(getTranslation('moduleTrading.notSelected'));
        });

        it('should allow to select payment method', () => {
            const { getByText, getByLabelText, getByTestId } =
                renderPaymentMethodPicker(withQuotes);

            fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.paymentMethod')));
            fireEvent.press(getByText(creditCardPaymentMethodTranslation));

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedPaymentMethod')),
            ).toHaveTextContent(creditCardPaymentMethodTranslation);

            const picker = getByTestId('@trading/buy/payment-method-picker');

            expect(
                within(picker).getByTestId('@icons/payment-method-icon/creditCard'),
            ).toBeTruthy();
        });

        it('should display loader while quotes are fetched', () => {
            const { getByLabelText } = renderPaymentMethodPicker(
                mergeDeepObject(withQuotes, {
                    wallet: { trading: { buy: { isLoading: true } } },
                }),
            );

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
            ).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', () => {
            const store = createLightStore({
                reducer,
                preloadedState: {
                    device: deviceInitialState,
                    wallet: {
                        trading: getWalletState({ tradeType: 'buy' }).trading,
                    },
                },
            });
            store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
            const { getByText } = renderPaymentMethodPicker(undefined, store);

            fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.paymentMethod')));
            act(() => {
                store.dispatch(tradingBuyActions.setIsLoading(true));
            });

            expect(getByText(creditCardPaymentMethodTranslation)).toBeOnTheScreen();
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on payment method select', () => {
                const { getByText } = renderPaymentMethodPicker(withQuotes);

                fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.paymentMethod')),
                );
                fireEvent.press(getByText(creditCardPaymentMethodTranslation));

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

                fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.paymentMethod')),
                );
                fireEvent.press(getByText('Apple Pay'));

                expect(reportMock).toHaveBeenCalledTimes(1);
            });

            it('should not fire analytics event when same payment method is selected', () => {
                const { getByText, getAllByText } = renderPaymentMethodPicker(withQuotes);

                act(() => {
                    form.setValue('quote', cexdirectCreditCardBuyQuote);
                });

                fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.paymentMethod')),
                );
                const creditCardOption = getAllByText(creditCardPaymentMethodTranslation)[1];
                if (!creditCardOption) throw new Error('Credit Card option [1] not found');
                fireEvent.press(creditCardOption);

                expect(reportMock).toHaveBeenCalledTimes(0);
            });
        });
    });
});
