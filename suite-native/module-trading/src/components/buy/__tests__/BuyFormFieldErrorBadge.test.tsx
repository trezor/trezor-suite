import type { CryptoId } from 'invity-api';

import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    PreloadedState,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { btcAsset, getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';
import { BuyFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFormFieldErrorBadge, BuyFormFieldErrorBadgeProps } from '../BuyFormFieldErrorBadge';

describe('BuyFormFieldErrorBadge', () => {
    let tradingForm: BuyFormType;

    const renderUseTradingBuyForm = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm(), {
            preloadedState,
        });

        return result.current;
    };

    const renderBuyFormFieldErrorBadge = (
        props: BuyFormFieldErrorBadgeProps,
        form: BuyFormType,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <BuyFormFieldErrorBadge {...props} />
            </Form>,
            { preloadedState },
        );

    beforeEach(async () => {
        tradingForm = await renderUseTradingBuyForm();
    });

    it('should render nothing where there is no error in form', async () => {
        const { toJSON } = await renderBuyFormFieldErrorBadge(
            { fieldName: 'fiatValue' },
            tradingForm,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render error when field has error', async () => {
        act(() => {
            tradingForm.setError('fiatValue', {
                type: 'manual',
                message: 'Error message',
            });
        });
        const { getByText } = await renderBuyFormFieldErrorBadge(
            { fieldName: 'fiatValue' },
            tradingForm,
        );

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

        it('should render badge when quote has different crypto value than requested', async () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0006');
            });

            const { getByText } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(getByText('Provider offer: 0.0005 BTC')).toBeTruthy();
        });

        it('should not render badge when crypto amount does not differ', async () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0005');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when crypto amount does not differ but contains trailing zeros', async () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0005000');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge while quotes are loading', async () => {
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

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
                preloadedState,
            );

            expect(toJSON()).toBeNull();
        });

        it('should render badge when quote has different fiat value than requested', async () => {
            act(() => {
                tradingForm.setValue('fiatValue', '11.0');
            });

            const { getByText } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(getByText('Provider offer: $10.00')).toBeTruthy();
        });

        it('should not render badge when fiat amount does not differ', async () => {
            act(() => {
                tradingForm.setValue('fiatValue', '10.0');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for cryptoValue when rendering different form field badge', async () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0006');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for fiatValue when rendering different form field badge', async () => {
            act(() => {
                tradingForm.setValue('fiatValue', '11.0');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', async () => {
            act(() => {
                tradingForm.setValue('fiatValue', '10.000');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should correctly compare with amount in sats', async () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '50000');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
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

        it('should correctly display amount in sats', async () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '51000');
            });

            const { getByText } = await renderBuyFormFieldErrorBadge(
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

        it('should not render badge when crypto amount does not differ', async () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0005');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when crypto amount does not differ but contains trailing zeros', async () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoValue', '0.0005000');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ', async () => {
            act(() => {
                tradingForm.setValue('fiatValue', '10.0');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', async () => {
            act(() => {
                tradingForm.setValue('fiatValue', '10.000');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });
    });
});
