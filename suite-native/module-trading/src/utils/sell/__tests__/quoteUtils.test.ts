import { type CryptoId } from 'invity-api';

import { type MinimalSellFormProps } from '@suite-common/trading';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils';
import { btcAsset, getWalletState } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../hooks/sell/useSellForm';
import { tradingSellFormToTradingSellFormProps } from '../quotesUtils';

describe('quoteUtils', () => {
    let form: SellFormType;

    const renderUseTradingSellForm = () =>
        renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState: { wallet: getWalletState({ tradeType: 'sell' }) },
        });

    beforeEach(() => {
        const { result } = renderUseTradingSellForm();
        form = result.current;
    });

    describe('tradingSellFormToTradingSellFormProps', () => {
        it('should throw when sendAsset is not specified', () => {
            expect(() => tradingSellFormToTradingSellFormProps(form.getValues)).toThrow(
                'sendAsset is required',
            );
        });

        it('should throw when amountInCrypto is true and cryptoStringAmount is not specified', () => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('amountInCrypto', true);
            });

            expect(() => tradingSellFormToTradingSellFormProps(form.getValues)).toThrow(
                'cryptoStringAmount is required',
            );
        });

        it('should throw when amountInCrypto is false and fiatStringAmount is not specified', () => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('amountInCrypto', false);
            });

            expect(() => tradingSellFormToTradingSellFormProps(form.getValues)).toThrow(
                'fiatStringAmount is required',
            );
        });

        it('should return correct MinimalSellFormProps when all values are specified and amountInCrypto is true', () => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('amountInCrypto', true);
                form.setValue('cryptoStringAmount', '0.1');
            });

            expect(tradingSellFormToTradingSellFormProps(form.getValues)).toEqual({
                amountInCrypto: true,
                outputs: [
                    {
                        amount: '0.1',
                        fiat: undefined,
                        currency: { value: 'usd' },
                    },
                ],
                countrySelect: {
                    label: '🇨🇿 Czechia',
                    shortLabel: '🇨🇿 CZE',
                    value: 'CZ',
                    codeAlpha3: 'CZE',
                    flag: '🇨🇿',
                    name: 'Czechia',
                },
                sendCryptoSelect: {
                    id: 'bitcoin' as CryptoId,
                },
            } satisfies MinimalSellFormProps);
        });

        it('should return correct MinimalSellFormProps when all values are specified and amountInCrypto is false', () => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('amountInCrypto', false);
                form.setValue('fiatStringAmount', '1000');
            });

            expect(tradingSellFormToTradingSellFormProps(form.getValues)).toEqual({
                amountInCrypto: false,
                outputs: [
                    {
                        amount: undefined,
                        fiat: '1000',
                        currency: { value: 'usd' },
                    },
                ],
                countrySelect: {
                    label: '🇨🇿 Czechia',
                    shortLabel: '🇨🇿 CZE',
                    value: 'CZ',
                    codeAlpha3: 'CZE',
                    flag: '🇨🇿',
                    name: 'Czechia',
                },
                sendCryptoSelect: {
                    id: 'bitcoin' as CryptoId,
                },
            } satisfies MinimalSellFormProps);
        });
    });
});
