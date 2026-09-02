import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, btcAsset } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import {
    SellFormFieldErrorBadge,
    type SellFormFieldErrorBadgeProps,
} from './SellFormFieldErrorBadge';
import { useSellForm } from '../../hooks/sell/useSellForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

describe('SellFormFieldErrorBadge', () => {
    let tradingForm: SellFormType;

    const renderUseTradingSellForm = async () => {
        const { result } = await renderHookWithTradingProvider(() => useSellForm(), {
            tradeType: 'sell',
        });

        return result.current;
    };

    const getOverrides = (
        bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
    ): PreloadedStatePartial<TradingTestPreloadedState> => ({
        wallet: { settings: { bitcoinAmountUnit } },
    });

    const renderSellFormFieldErrorBadge = async (
        props: SellFormFieldErrorBadgeProps,
        form: SellFormType,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = getOverrides(),
    ) =>
        await renderWithTradingProvider(
            <Form form={form}>
                <SellFormFieldErrorBadge {...props} />
            </Form>,
            { tradeType: 'sell', overrides },
        );

    beforeEach(async () => {
        tradingForm = await renderUseTradingSellForm();
    });

    describe('for fiatStringAmount', () => {
        it('should render nothing where there is no error in form', async () => {
            const { toJSON } = await renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should render error when field has error', async () => {
            await act(() => {
                tradingForm.setError('fiatStringAmount', {
                    type: 'manual',
                    message: 'Error message',
                });
            });
            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(getByText('Error message')).toBeOnTheScreen();
        });
    });

    describe('for cryptoStringAmount', () => {
        it('should display nothing when asset is not selected', async () => {
            const { toJSON } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        describe('with asset', () => {
            beforeEach(async () => {
                await act(() => {
                    tradingForm.setValue('sendAsset', btcAsset);
                });
            });

            it('should display nothing when amount is not set', async () => {
                const { toJSON } = await renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                );

                expect(toJSON()).toBeNull();
            });

            it('should display formatted value when amount is 0', async () => {
                await act(() => {
                    tradingForm.setValue('cryptoStringAmount', '0');
                });

                const { getByText } = await renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                );

                expect(getByText('$0.00')).toBeOnTheScreen();
            });

            it('should display formatted value when amount is set', async () => {
                await act(() => {
                    tradingForm.setValue('cryptoStringAmount', '1234567');
                });

                const { getByText } = await renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                );

                expect(getByText('$1,234.57')).toBeOnTheScreen();
            });

            it('should display error message when field has error', async () => {
                await act(() => {
                    tradingForm.setError('cryptoStringAmount', {
                        type: 'manual',
                        message: 'VALIDATION_ERROR',
                    });
                    tradingForm.setValue('cryptoStringAmount', '1000');
                });

                const { getByText, queryByText } = await renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                );

                expect(queryByText('$1.00')).toBeNull();
                expect(getByText('VALIDATION_ERROR')).toBeOnTheScreen();
            });

            it('should display formatted fiat value when field has error, but quotes are loading', async () => {
                await act(() => {
                    tradingForm.setError('cryptoStringAmount', {
                        type: 'manual',
                        message: 'VALIDATION_ERROR',
                    });
                    tradingForm.setValue('cryptoStringAmount', '1000');
                });
                const overrides = {
                    wallet: { trading: { sell: { isLoading: true } } },
                };

                const { getByText, queryByText } = await renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                    overrides,
                );

                expect(queryByText('VALIDATION_ERROR')).toBeNull();
                expect(getByText('$1.00')).toBeOnTheScreen();
            });

            it('should display correct value when using sats', async () => {
                await act(() => {
                    tradingForm.setValue('cryptoStringAmount', '1234567123456');
                });

                const { getByText } = await renderSellFormFieldErrorBadge(
                    { fieldName: 'cryptoStringAmount' },
                    tradingForm,
                    getOverrides(PROTO.AmountUnit.SATOSHI),
                );

                expect(getByText('$12.35')).toBeOnTheScreen();
            });
        });
    });

    describe('with selected quote', () => {
        beforeEach(async () => {
            await act(() => {
                tradingForm.setValue('sendAsset', btcAsset);
                tradingForm.setValue('quote', banxaCreditCardSellQuote);
            });
        });

        it('should render badge when quote has different crypto value than requested', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0235');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(
                getByText(
                    getTranslation('moduleTrading.tradingScreen.providerOffer', {
                        amount: '0.0233 BTC',
                    }),
                ),
            ).toBeOnTheScreen();
        });

        it('should render $ value badge when crypto amount does not differ', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0233');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should render $ value badge when crypto amount does not differ but contains trailing zeros', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.023300');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should render $ value badge while quotes are loading', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0006');
            });
            const overrides = {
                wallet: { trading: { sell: { isLoading: true } } },
            };

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
                overrides,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should render badge when quote has different fiat value than requested', async () => {
            await act(() => {
                tradingForm.setValue('fiatStringAmount', '91');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(
                getByText(
                    getTranslation('moduleTrading.tradingScreen.providerOffer', {
                        amount: '$90.17',
                    }),
                ),
            ).toBeOnTheScreen();
        });

        it('should not render badge when fiat amount does not differ', async () => {
            await act(() => {
                tradingForm.setValue('fiatStringAmount', '90.17');
            });

            const { toJSON } = await renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for cryptoStringAmount when rendering different form field badge', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0006');
            });

            const { toJSON } = await renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge for fiatStringAmount when rendering different form field badge', async () => {
            await act(() => {
                tradingForm.setValue('fiatStringAmount', '11.0');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', async () => {
            await act(() => {
                tradingForm.setValue('fiatStringAmount', '90.170');
            });

            const { toJSON } = await renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should correctly compare with amount in sats', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '2330000');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
                getOverrides(PROTO.AmountUnit.SATOSHI),
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should correctly display amount in sats', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '2330001');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
                getOverrides(PROTO.AmountUnit.SATOSHI),
            );

            expect(
                getByText(
                    getTranslation('moduleTrading.tradingScreen.providerOffer', {
                        amount: '2,330,000 sat',
                    }),
                ),
            ).toBeOnTheScreen();
        });
    });

    describe('with quote with trailing zeros', () => {
        beforeEach(async () => {
            await act(() => {
                tradingForm.setValue('sendAsset', btcAsset);
                tradingForm.setValue('quote', {
                    ...banxaCreditCardSellQuote,
                    cryptoStringAmount: '00.00050',
                    fiatStringAmount: '10.0000',
                });
            });
        });

        it('should not render badge when crypto amount does not differ', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0005');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should not render badge when crypto amount does not differ but contains trailing zeros', async () => {
            await act(() => {
                tradingForm.setValue('amountInCrypto', true);
            });
            await act(() => {
                tradingForm.setValue('cryptoStringAmount', '0.0005000');
            });

            const { getByText } = await renderSellFormFieldErrorBadge(
                { fieldName: 'cryptoStringAmount' },
                tradingForm,
            );

            expect(getByText('$0.00')).toBeOnTheScreen();
        });

        it('should not render badge when fiat amount does not differ', async () => {
            await act(() => {
                tradingForm.setValue('fiatStringAmount', '10.0');
            });

            const { toJSON } = await renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render badge when fiat amount does not differ but contains trailing zeros', async () => {
            await act(() => {
                tradingForm.setValue('fiatStringAmount', '10.000');
            });

            const { toJSON } = await renderSellFormFieldErrorBadge(
                { fieldName: 'fiatStringAmount' },
                tradingForm,
            );

            expect(toJSON()).toBeNull();
        });
    });
});
