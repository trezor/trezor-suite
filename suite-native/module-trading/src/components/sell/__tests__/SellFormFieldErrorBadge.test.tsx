import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, btcAsset } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import {
    SellFormFieldErrorBadge,
    type SellFormFieldErrorBadgeProps,
} from '../SellFormFieldErrorBadge';

describe('SellFormFieldErrorBadge', () => {
    let tradingForm: SellFormType;

    const renderUseTradingSellForm = () => {
        const { result } = renderHookWithTradingProvider(() => useSellForm(), {
            tradeType: 'sell',
            providers: ['intl', 'formatter', 'navigation'],
        });

        return result.current;
    };

    const getOverrides = (
        bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
    ): PreloadedStatePartial<TradingTestPreloadedState> => ({
        wallet: { settings: { bitcoinAmountUnit } },
    });

    const renderSellFormFieldErrorBadge = (
        props: SellFormFieldErrorBadgeProps,
        form: SellFormType,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = getOverrides(),
    ) =>
        renderWithTradingProvider(
            <Form form={form}>
                <SellFormFieldErrorBadge {...props} />
            </Form>,
            { tradeType: 'sell', overrides, providers: ['intl', 'formatter', 'navigation'] },
        );

    beforeEach(() => {
        tradingForm = renderUseTradingSellForm();
    });

    describe('for fiatStringAmount', () => {
        it('should render nothing where there is no error in form', () => {
            const { toJSON } = renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should render error when field has error', () => {
            act(() => {
                tradingForm.setError('fiatStringAmount', {
                    type: 'manual',
                    message: 'Error message',
                });
            });
            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(getByText('Error message')).toBeOnTheScreen();
        });
    });

    describe('for cryptoStringAmount', () => {
        it('should display nothing when asset is not selected', () => {
            const { toJSON } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        describe('with asset', () => {
            beforeEach(() => {
                act(() => {
                    tradingForm.setValue('sendAsset', btcAsset);
                });
            });

            it('should display nothing when amount is not set', () => {
                const { toJSON } = renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                );

                expect(toJSON()).toBeNull();
            });

            it('should display formatted value when amount is 0', () => {
                act(() => {
                    tradingForm.setValue('cryptoStringAmount', '0');
                });

                const { getByText } = renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                );

                expect(getByText('$0.00')).toBeOnTheScreen();
            });

            it('should display formatted value when amount is set', () => {
                act(() => {
                    tradingForm.setValue('cryptoStringAmount', '1234567');
                });

                const { getByText } = renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                );

                expect(getByText('$1,234.57')).toBeOnTheScreen();
            });

            it('should display error message when field has error', () => {
                act(() => {
                    tradingForm.setError('cryptoStringAmount', {
                        type: 'manual',
                        message: 'VALIDATION_ERROR',
                    });
                    tradingForm.setValue('cryptoStringAmount', '1000');
                });

                const { getByText, queryByText } = renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                );

                expect(queryByText('$1.00')).toBeNull();
                expect(getByText('VALIDATION_ERROR')).toBeOnTheScreen();
            });

            it('should display formatted fiat value when field has error, but quotes are loading', () => {
                act(() => {
                    tradingForm.setError('cryptoStringAmount', {
                        type: 'manual',
                        message: 'VALIDATION_ERROR',
                    });
                    tradingForm.setValue('cryptoStringAmount', '1000');
                });
                const overrides = {
                    wallet: { trading: { sell: { isLoading: true } } },
                };

                const { getByText, queryByText } = renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                    overrides,
                );

                expect(queryByText('VALIDATION_ERROR')).toBeNull();
                expect(getByText('$1.00')).toBeOnTheScreen();
            });

            it('should display correct value when using sats', () => {
                act(() => {
                    tradingForm.setValue('cryptoStringAmount', '1234567123456');
                });

                const { getByText } = renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                    getOverrides(PROTO.AmountUnit.SATOSHI),
                );

                expect(getByText('$12.35')).toBeOnTheScreen();
            });
        });
    });

    describe('with selected quote', () => {
        beforeEach(() => {
            act(() => {
                tradingForm.setValue('sendAsset', btcAsset);
                tradingForm.setValue('quote', banxaCreditCardSellQuote);
            });
        });

        it('should render badge when quote has different crypto value than requested', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0235');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('Provider offer: 0.0233 BTC')).toBeOnTheScreen();
        });

        it('should render $ value badge when crypto amount does not differ', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0233');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should render $ value badge when crypto amount does not differ but contains trailing zeros', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.023300');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should render $ value badge while quotes are loading', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0006');
            });
            const overrides = {
                wallet: { trading: { sell: { isLoading: true } } },
            };

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
                overrides,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should render badge when quote has different fiat value than requested', () => {
            act(() => {
                tradingForm.setValue('fiatStringAmount', '91');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(getByText('Provider offer: $90.17')).toBeOnTheScreen();
        });

        it('should not render badge when fiat amount does not differ', () => {
            act(() => {
                tradingForm.setValue('fiatStringAmount', '90.17');
            });

            const { toJSON } = renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for cryptoStringAmount when rendering different form field badge', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0006');
            });

            const { toJSON } = renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for fiatStringAmount when rendering different form field badge', () => {
            act(() => {
                tradingForm.setValue('fiatStringAmount', '11.0');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', () => {
            act(() => {
                tradingForm.setValue('fiatStringAmount', '90.170');
            });

            const { toJSON } = renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should correctly compare with amount in sats', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '2330000');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
                getOverrides(PROTO.AmountUnit.SATOSHI),
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should correctly display amount in sats', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '2330001');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
                getOverrides(PROTO.AmountUnit.SATOSHI),
            );

            expect(getByText('Provider offer: 2,330,000 sat')).toBeOnTheScreen();
        });
    });

    describe('with quote with trailing zeros', () => {
        beforeEach(() => {
            act(() => {
                tradingForm.setValue('sendAsset', btcAsset);
                tradingForm.setValue('quote', {
                    ...banxaCreditCardSellQuote,
                    cryptoStringAmount: '00.00050',
                    fiatStringAmount: '10.0000',
                });
            });
        });

        it('should not render badge when crypto amount does not differ', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0005');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should not render badge when crypto amount does not differ but contains trailing zeros', () => {
            act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0005000');
            });

            const { getByText } = renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should not render badge when fiat amount does not differ', () => {
            act(() => {
                tradingForm.setValue('fiatStringAmount', '10.0');
            });

            const { toJSON } = renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', () => {
            act(() => {
                tradingForm.setValue('fiatStringAmount', '10.000');
            });

            const { toJSON } = renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });
    });
});
