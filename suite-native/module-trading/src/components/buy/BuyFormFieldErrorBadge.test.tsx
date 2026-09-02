import type { CryptoId } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils-store';
import { btcAsset, getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { BuyFormFieldErrorBadge, type BuyFormFieldErrorBadgeProps } from './BuyFormFieldErrorBadge';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

describe('BuyFormFieldErrorBadge', () => {
    let tradingForm: BuyFormType;

    const renderUseTradingBuyForm = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const { result } = await renderHookWithTradingProvider(() => useBuyForm(), {
            overrides,
        });

        return result.current;
    };

    const renderBuyFormFieldErrorBadge = async (
        props: BuyFormFieldErrorBadgeProps,
        form: BuyFormType,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(<BuyFormFieldErrorBadge {...props} />, {
            overrides,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        tradingForm = await renderUseTradingBuyForm();
    });

    it('should render nothing when there is no error in form', async () => {
        const { toJSON } = await renderBuyFormFieldErrorBadge(
            { fieldName: 'fiatValue' },
            tradingForm,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render children when there is no error in form', async () => {
        const { getByText } = await renderBuyFormFieldErrorBadge(
            { fieldName: 'fiatValue', children: <Text>CHILDREN</Text> },
            tradingForm,
        );

        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });

    it('should render error when field has error', async () => {
        await act(() => {
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
        beforeEach(async () => {
            await act(() => {
                tradingForm.setValue('asset', btcAsset);
            });
            await act(() => {
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
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoValue', '0.0006');
            });

            const { getByText } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(
                getByText(
                    getTranslation('moduleTrading.tradingScreen.providerOffer', {
                        amount: '0.0005 BTC',
                    }),
                ),
            ).toBeTruthy();
        });

        it('should not render badge when crypto amount does not differ', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoValue', '0.0005');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when crypto amount does not differ but contains trailing zeros', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoValue', '0.0005000');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge while quotes are loading', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
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
            await act(() => {
                tradingForm.setValue('fiatValue', '11.0');
            });

            const { getByText } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(
                getByText(
                    getTranslation('moduleTrading.tradingScreen.providerOffer', {
                        amount: '$10.00',
                    }),
                ),
            ).toBeTruthy();
        });

        it('should not render badge when fiat amount does not differ', async () => {
            await act(() => {
                tradingForm.setValue('fiatValue', '10.0');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for cryptoValue when rendering different form field badge', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoValue', '0.0006');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for fiatValue when rendering different form field badge', async () => {
            await act(() => {
                tradingForm.setValue('fiatValue', '11.0');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', async () => {
            await act(() => {
                tradingForm.setValue('fiatValue', '10.000');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should correctly compare with amount in sats', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
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
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
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

            expect(
                getByText(
                    getTranslation('moduleTrading.tradingScreen.providerOffer', {
                        amount: '50,000 sat',
                    }),
                ),
            ).toBeTruthy();
        });
    });

    describe('with quote with trailing zeros', () => {
        beforeEach(async () => {
            await act(() => {
                tradingForm.setValue('asset', btcAsset);
            });
            await act(() => {
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
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoValue', '0.0005');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when crypto amount does not differ but contains trailing zeros', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoValue', '0.0005000');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'cryptoValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ', async () => {
            await act(() => {
                tradingForm.setValue('fiatValue', '10.0');
            });

            const { toJSON } = await renderBuyFormFieldErrorBadge(
                { fieldName: 'fiatValue' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', async () => {
            await act(() => {
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
