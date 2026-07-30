import { getTranslation } from '@suite-native/intl';
import { act, userEvent } from '@suite-native/test-utils-store';
import {
    banxaBankTransferSellQuote,
    cexdirectCreditCardBuyQuote,
    getInitializedTradingStateWithQuotes,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { PaymentMethodListItem, type PaymentMethodListItemProps } from './PaymentMethodListItem';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('PaymentMethodListItem', () => {
    const defaultOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: getInitializedTradingStateWithQuotes(),
        },
    };

    const shortfallQuote = {
        ...mercuryoApplePayBuyQuote,
        fiatStringAmount: '8',
        orderId: 'order-id-payment-method-shortfall',
    };

    const shortfallOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                ...getInitializedTradingStateWithQuotes(),
                buy: {
                    ...getInitializedTradingStateWithQuotes().buy,
                    quotesRequest: {
                        wantCrypto: false,
                        receiveCurrency: shortfallQuote.receiveCurrency,
                        fiatCurrency: 'USD',
                        fiatStringAmount: '10',
                    },
                },
            },
        },
    };

    const wantCryptoOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                ...getInitializedTradingStateWithQuotes(),
                buy: {
                    ...getInitializedTradingStateWithQuotes().buy,
                    quotesRequest: {
                        wantCrypto: true,
                        receiveCurrency: mercuryoApplePayBuyQuote.receiveCurrency,
                        fiatCurrency: 'EUR',
                        cryptoStringAmount: mercuryoApplePayBuyQuote.receiveStringAmount,
                    },
                },
            },
        },
    };

    const cryptoShortfallOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                ...getInitializedTradingStateWithQuotes(),
                buy: {
                    ...getInitializedTradingStateWithQuotes().buy,
                    quotesRequest: {
                        wantCrypto: true,
                        receiveCurrency: mercuryoApplePayBuyQuote.receiveCurrency,
                        fiatCurrency: 'EUR',
                        cryptoStringAmount: '0.002',
                    },
                },
            },
        },
    };

    const renderPaymentMethodListItem = (
        props: Partial<PaymentMethodListItemProps<any>>,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = defaultOverrides,
    ) =>
        renderWithTradingProvider(
            <PaymentMethodListItem
                quote={mercuryoApplePayBuyQuote}
                onPress={jest.fn()}
                {...props}
            />,
            { overrides },
        );

    it('should render given name and receive amount', () => {
        const { getByText, queryByText } = renderPaymentMethodListItem({});

        expect(getByText('Apple Pay')).toBeOnTheScreen();
        expect(getByText('0.00100017 BTC')).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.providerListItem.rate'))).toBeNull();
    });

    it('should display fiat amount instead of receive amount when user requested a crypto amount', () => {
        const { getByText, queryByText } = renderPaymentMethodListItem({}, wantCryptoOverrides);

        expect(getByText('€10.00')).toBeOnTheScreen();
        expect(queryByText('0.00100017 BTC')).toBeNull();
    });

    it('should display crypto amount difference in shortfall note when user requested a crypto amount', () => {
        const cryptoShortfallQuote = {
            ...mercuryoApplePayBuyQuote,
            receiveStringAmount: '0.001',
            orderId: 'order-id-crypto-shortfall',
        };

        const { getByText } = renderPaymentMethodListItem(
            { quote: cryptoShortfallQuote },
            cryptoShortfallOverrides,
        );

        expect(getByText('50% less to receive than requested (0.001 BTC)')).toBeOnTheScreen();
    });

    it('should render shortfall note for a shortfall quote', () => {
        const { getByText } = renderPaymentMethodListItem(
            { quote: shortfallQuote },
            shortfallOverrides,
        );

        expect(getByText('20% less to receive than requested (€2.00)')).toBeOnTheScreen();
    });

    it('should not render shortfall note when shortfall is not present', () => {
        const { queryByText } = renderPaymentMethodListItem({});

        expect(queryByText(/less to receive/)).toBeNull();
    });

    it('should render payment method logo for branded payment methods', () => {
        const { getByTestId } = renderPaymentMethodListItem({});

        expect(getByTestId('@icons/payment-method-logo/applePay')).toBeOnTheScreen();
    });

    it('should render fallback icon for non-branded payment methods', () => {
        const { getByTestId } = renderPaymentMethodListItem({
            quote: cexdirectCreditCardBuyQuote,
        });

        expect(getByTestId('@icons/payment-method-icon/creditCard')).toBeOnTheScreen();
    });

    it('should call onPress callback on item press', async () => {
        const onPress = jest.fn();
        const { getByText } = renderPaymentMethodListItem({ onPress });

        await act(async () => {
            await userEvent.press(getByText('Apple Pay'));
        });

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not render receive amount row when receive amount is unknown', () => {
        const { getByText, queryByText } = renderPaymentMethodListItem({
            quote: { ...mercuryoApplePayBuyQuote, receiveStringAmount: undefined },
        });

        expect(getByText('Apple Pay')).toBeOnTheScreen();
        expect(queryByText('0.00100017 BTC')).toBeNull();
    });

    describe('sell trade', () => {
        const sellQuote = {
            ...banxaBankTransferSellQuote,
            cryptoStringAmount: '1',
            fiatStringAmount: '100.00',
        };

        const sellFiatRequestOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: {
                trading: {
                    ...getInitializedTradingStateWithQuotes(),
                    sell: {
                        ...getInitializedTradingStateWithQuotes().sell,
                        quotesRequest: {
                            amountInCrypto: false,
                            country: 'CZ',
                            cryptoCurrency: sellQuote.cryptoCurrency,
                            fiatCurrency: 'USD',
                            fiatStringAmount: '100',
                            paymentMethod: 'bankTransfer',
                        },
                    },
                },
            },
        };

        const sellCryptoRequestOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: {
                trading: {
                    ...getInitializedTradingStateWithQuotes(),
                    sell: {
                        ...getInitializedTradingStateWithQuotes().sell,
                        quotesRequest: {
                            amountInCrypto: true,
                            country: 'CZ',
                            cryptoCurrency: sellQuote.cryptoCurrency,
                            fiatCurrency: 'USD',
                            cryptoStringAmount: '1',
                            paymentMethod: 'bankTransfer',
                        },
                    },
                },
            },
        };

        it('should display crypto amount to sell when user requested a fixed fiat amount', () => {
            const { getByText, queryByText } = renderPaymentMethodListItem(
                { quote: sellQuote },
                sellFiatRequestOverrides,
            );

            expect(getByText('1 ETH')).toBeOnTheScreen();
            expect(queryByText('$100.00')).toBeNull();
        });

        it('should display fiat amount to receive when user requested a fixed crypto amount', () => {
            const { getByText, queryByText } = renderPaymentMethodListItem(
                { quote: sellQuote },
                sellCryptoRequestOverrides,
            );

            expect(getByText('$100.00')).toBeOnTheScreen();
            expect(queryByText('1 ETH')).toBeNull();
        });

        it('should render shortfall note when sell quote receives less fiat than requested', () => {
            const shortfallSellQuote = {
                ...sellQuote,
                fiatStringAmount: '70',
                orderId: 'order-id-sell-shortfall',
            };

            const { getByText } = renderPaymentMethodListItem(
                { quote: shortfallSellQuote },
                sellFiatRequestOverrides,
            );

            expect(getByText('30% less to receive than requested ($30.00)')).toBeOnTheScreen();
        });

        it('should not render shortfall note for a sell quote when there is no shortfall', () => {
            const { queryByText } = renderPaymentMethodListItem({ quote: sellQuote });

            expect(queryByText(/less to receive/)).toBeNull();
        });
    });
});
