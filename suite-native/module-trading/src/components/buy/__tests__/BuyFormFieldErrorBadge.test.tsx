import type { CryptoId } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import { btcAsset, getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';
import { BuyFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFormFieldErrorBadge, BuyFormFieldErrorBadgeProps } from '../BuyFormFieldErrorBadge';

describe('BuyFormFieldErrorBadge', () => {
    let tradingForm: BuyFormType;

    const renderUseTradingBuyForm = (preloadedState: PreloadedState = {}) => {
        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
        });

        return result.current;
    };

    const renderBuyFormFieldErrorBadge = (
        props: BuyFormFieldErrorBadgeProps,
        form: BuyFormType,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProvider(<BuyFormFieldErrorBadge {...props} />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        tradingForm = renderUseTradingBuyForm();
    });

    it('should render nothing when there is no error in form', () => {
        const { toJSON } = renderBuyFormFieldErrorBadge({ fieldName: 'fiatValue' }, tradingForm);

        expect(toJSON()).toBeNull();
    });

    it('should render children when there is no error in form', () => {
        const { getByText } = renderBuyFormFieldErrorBadge(
            { fieldName: 'fiatValue', children: <Text>CHILDREN</Text> },
            tradingForm,
        );

        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });

    it('should render error when field has error', () => {
        act(() => {
            tradingForm.setError('fiatValue', {
                type: 'manual',
                message: 'Error message',
            });
        });
        const { getByText } = renderBuyFormFieldErrorBadge({ fieldName: 'fiatValue' }, tradingForm);

        expect(getByText('Error message')).toBeTruthy();
    });

    describe('with selected quote', () => {
        beforeEach(() => {
            act(() => {
                tradingForm.setValue('asset', btcAsset);
            });
            act(() => {
                tradingForm.setValue('quote', {
                    fiatStringAmount: '10',
                    fiatCurrency: 'USD',
                    receiveCurrency: 'bitcoin' as CryptoId,
                    receiveStringAmount: '0.0005',
                    rate: 20000,
                    quoteId: 'test-quote-id',
                    exchange: 'invity',
                    paymentMethod: 'creditCard',
                    paymentMethodName: 'Credit Card',
                    orderId: 'order_id_1',
                    paymentId: 'test-payment-id',
                });
            });
        });

        it('should render badge when quote has different crypto value than requested', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0006');
            });

            const { getByText } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(getByText('Provider offer: 0.0005 BTC')).toBeTruthy();
        });

        it('should not render badge when crypto amount does not differ', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0005');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when crypto amount does not differ but contains trailing zeros', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0005000');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge while quotes are loading', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0006');
            });
            const preloadedState = {
                wallet: { trading: getInitializedTradingStateWithQuotes() },
            };
            preloadedState!.wallet!.trading!.buy!.isLoading = true;

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
                preloadedState,
            );

            expect(toJSON()).toBeNull();
        });

        it('should render badge when quote has different fiat value than requested', () => {
            act(() => {
                tradingForm.setValue('fiatValue', '11.0');
            });

            const { getByText } = renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(getByText('Provider offer: $10.00')).toBeTruthy();
        });

        it('should not render badge when fiat amount does not differ', () => {
            act(() => {
                tradingForm.setValue('fiatValue', '10.0');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for cryptoValue when rendering different form field badge', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0006');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for fiatValue when rendering different form field badge', () => {
            act(() => {
                tradingForm.setValue('fiatValue', '11.0');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', () => {
            act(() => {
                tradingForm.setValue('fiatValue', '10.000');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should correctly compare with amount in sats', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '50000');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
                {
                    wallet: {
                        settings: {
                            bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
                        },
                    },
                },
            );

            expect(toJSON()).toBeNull();
        });

        it('should correctly display amount in sats', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '51000');
            });

            const { getByText } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
                {
                    wallet: {
                        settings: {
                            bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
                        },
                    },
                },
            );

            expect(getByText('Provider offer: 50,000 sat')).toBeTruthy();
        });
    });

    describe('with quote with trailing zeros', () => {
        beforeEach(() => {
            act(() => {
                tradingForm.setValue('asset', btcAsset);
            });
            act(() => {
                tradingForm.setValue('quote', {
                    fiatStringAmount: '10.0000',
                    fiatCurrency: 'USD',
                    receiveCurrency: 'bitcoin' as CryptoId,
                    receiveStringAmount: '00.00050',
                    rate: 20000,
                    quoteId: 'test-quote-id',
                    exchange: 'invity',
                    paymentMethod: 'creditCard',
                    paymentMethodName: 'Credit Card',
                    orderId: 'order_id_1',
                    paymentId: 'test-payment-id',
                });
            });
        });

        it('should not render badge when crypto amount does not differ', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0005');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when crypto amount does not differ but contains trailing zeros', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0005000');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ', () => {
            act(() => {
                tradingForm.setValue('fiatValue', '10.0');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', () => {
            act(() => {
                tradingForm.setValue('fiatValue', '10.000');
            });

            const { toJSON } = renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });
    });
});
