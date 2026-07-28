import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
    within,
} from '@suite-native/test-utils-store';
import { banxaBankTransferSellQuote, sellQuotes } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';
import { getIndexOrThrow } from '@trezor/utils';

import { SellReceiveMethodPicker } from './SellReceiveMethodPicker';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingPreloadedState,
} from '../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../hooks/sell/useSellForm';

const reportMock = jest.fn();
const creditCardPaymentMethodTranslation = getTranslation(
    'moduleTrading.paymentMethods.creditCard',
);
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('SellReceiveMethodPicker', () => {
    let form: SellFormType;

    const renderSellReceiveMethodPicker = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithStoreProvider(<SellReceiveMethodPicker />, {
            preloadedState: createTradingPreloadedState({ tradeType: 'sell', overrides }),
            services,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        jest.clearAllMocks();

        const { result } = renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState: createTradingPreloadedState({ tradeType: 'sell' }),
            services,
        });
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render nothing when no quotes are loaded', () => {
        const { toJSON } = renderSellReceiveMethodPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', () => {
        const { getByLabelText } = renderSellReceiveMethodPicker({
            wallet: { trading: { sell: { isLoading: true } } },
        });

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
        ).toBeOnTheScreen();
    });

    it('should render "Not selected" when no quote is selected', () => {
        const { getByLabelText } = renderSellReceiveMethodPicker({
            wallet: { trading: { sell: { quotes: sellQuotes } } },
        });

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.noReceiveMethod')),
        ).toHaveTextContent(getTranslation('moduleTrading.notSelected'));
    });

    describe('with quotes loaded', () => {
        const withQuotes: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { trading: { sell: { quotes: sellQuotes } } },
        };

        beforeEach(() => {
            act(() => {
                form.setValue('quote', banxaBankTransferSellQuote);
            });
        });

        it('should render selected receive method', () => {
            const { getByLabelText, getByTestId } = renderSellReceiveMethodPicker(withQuotes);

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedReceiveMethod')),
            ).toHaveTextContent(getTranslation('moduleTrading.paymentMethods.bankTransfer'));

            const picker = getByTestId('@trading/sell/receive-method-picker');
            expect(within(picker).getByTestId('@icons/payment-method-icon/bank')).toBeTruthy();
        });

        it('should render loading skeleton when quotes are loaded and new quotes are loading', () => {
            const { getByLabelText } = renderSellReceiveMethodPicker({
                wallet: { trading: { sell: { quotes: sellQuotes, isLoading: true } } },
            });

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
            ).toBeOnTheScreen();
        });

        it('should allow to select receive method', () => {
            const { getByText, getByLabelText } = renderSellReceiveMethodPicker(withQuotes);

            fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.receiveMethod')));
            fireEvent.press(getByText(creditCardPaymentMethodTranslation));

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedReceiveMethod')),
            ).toHaveTextContent(creditCardPaymentMethodTranslation);
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on receive method select', () => {
                const { getByText } = renderSellReceiveMethodPicker(withQuotes);

                fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.receiveMethod')),
                );
                fireEvent.press(getByText(creditCardPaymentMethodTranslation));

                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'sell',
                        parameter: 'paymentMethod',
                    },
                });
            });

            it('should not fire analytics event when same receive method is selected', () => {
                const { getAllByText } = renderSellReceiveMethodPicker(withQuotes);

                fireEvent.press(
                    getIndexOrThrow(
                        getAllByText(getTranslation('moduleTrading.paymentMethods.bankTransfer')),
                        0,
                    ),
                );
                fireEvent.press(
                    getIndexOrThrow(
                        getAllByText(getTranslation('moduleTrading.paymentMethods.bankTransfer')),
                        1,
                    ),
                );

                expect(reportMock).toHaveBeenCalledTimes(0);
            });
        });
    });
});
