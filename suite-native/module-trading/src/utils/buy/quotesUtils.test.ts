import type { BuyTrade, CryptoId } from 'invity-api';

import { deviceInitialState } from '@suite-common/device';
import { type TradingAssetOption } from '@suite-common/trading';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    btc1NormalAccount,
    btcAsset,
    coins,
    getInitializedTradingState,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { getPaymentMethodFromBuyForm, tradingBuyFormToTradingBuyFormProps } from './quotesUtils';
import { useBuyForm } from '../../hooks/buy/useBuyForm';

describe('quotesUtils', () => {
    let form: BuyFormType;

    const renderUseTradingBuyForm = async () =>
        await renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState: {
                device: deviceInitialState,
                wallet: { trading: getInitializedTradingState() },
            },
        });

    beforeEach(async () => {
        const { result } = await renderUseTradingBuyForm();
        form = result.current;
    });

    describe('getPaymentMethodFromBuyForm', () => {
        it('should return undefined when quote is not set', () => {
            expect(getPaymentMethodFromBuyForm(form)).toBeUndefined();
        });

        it('should return TradingPaymentMethodListProps object when quote is set', async () => {
            await act(() => {
                form.setValue('quote', mercuryoApplePayBuyQuote);
            });

            expect(getPaymentMethodFromBuyForm(form)).toEqual({
                value: 'applePay',
                label: 'Apple Pay',
            });
        });
    });

    describe('tradingBuyFormToTradingBuyFormProps', () => {
        it('should throw when crypto value is not selected', () => {
            expect(() =>
                tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin, undefined),
            ).toThrow('Asset is required');
        });

        describe('with buy form populated', () => {
            beforeEach(async () => {
                await act(() => {
                    form.setValue('fiatValue', '100');
                    form.setValue('asset', btcAsset);
                    form.setValue('country', {
                        codeAlpha3: 'USA',
                        flag: '🇺🇸',
                        name: 'United States of America',
                        value: 'US',
                        label: '🇺🇸 United States',
                        shortLabel: '🇺🇸 USA',
                    });
                    form.setValue('countrySubdivision', {
                        label: 'California',
                        value: 'CA',
                        name: 'California',
                    });
                    form.setValue('quote', mercuryoApplePayBuyQuote);
                });
            });

            it('should throw when info is not defined', () => {
                expect(() =>
                    tradingBuyFormToTradingBuyFormProps(form, undefined, undefined),
                ).toThrow('CoinInfo is required');
            });

            it('should return correct props', () => {
                const props = tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin, undefined);
                expect(props).toEqual({
                    fiatInput: '100',
                    cryptoInput: '0.001000168',
                    currencySelect: {
                        value: 'czk',
                        label: 'Czech Koruna',
                    },
                    cryptoSelect: {
                        id: 'bitcoin' as CryptoId,
                        isNativeToken: true,
                        displaySymbolName: 'Bitcoin',
                        coingeckoId: 'bitcoin',
                        contractAddress: null,
                        name: 'Bitcoin',
                        symbol: 'btc',
                        displaySymbol: 'BTC',
                        networkName: 'Bitcoin',
                        networkSymbol: 'btc',
                    } satisfies TradingAssetOption,
                    countrySelect: {
                        label: '🇺🇸 United States',
                        codeAlpha3: 'USA',
                        flag: '🇺🇸',
                        name: 'United States of America',
                        shortLabel: '🇺🇸 USA',
                        value: 'US',
                    },
                    countrySubdivisionSelect: {
                        label: 'California',
                        value: 'CA',
                        name: 'California',
                    },
                    paymentMethod: {
                        value: 'applePay',
                        label: 'Apple Pay',
                    },
                    amountInCrypto: false,
                    receiveAddress: undefined,
                });
            });

            it('should set receiveAddress from address', async () => {
                await act(() => {
                    form.setValue('receiveAccount', {
                        account: btc1NormalAccount,
                        address: btc1NormalAccount.addresses!.unused[0],
                    });
                });

                const props = tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin, undefined);

                expect(props).toEqual(
                    expect.objectContaining({
                        receiveAddress: 'UNUSED1',
                    }),
                );
            });

            it('should set paymentMethod to undefined when provided quote is not complete', async () => {
                await act(() => {
                    form.setValue('quote', {
                        ...mercuryoApplePayBuyQuote,
                        paymentMethodName: undefined,
                    } as unknown as BuyTrade);
                });

                const props = tradingBuyFormToTradingBuyFormProps(form, coins.bitcoin, undefined);

                expect(props).toEqual(
                    expect.objectContaining({
                        paymentMethod: undefined,
                    }),
                );
            });
        });
    });
});
