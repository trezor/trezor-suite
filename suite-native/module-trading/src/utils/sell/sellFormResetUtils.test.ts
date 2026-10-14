import { useForm } from '@suite-native/forms';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import {
    banxaCreditCardSellQuote,
    btc1NormalAccount,
    btcAsset,
} from '@suite-native/trading-fixtures';
import { type SellFormValues } from '@suite-native/trading-types';

import { resetSellForm } from './sellFormResetUtils';
import { sellFormValidationSchema } from './sellFormValidationSchema';

describe('resetSellForm', () => {
    const renderFilledSellForm = async () => {
        const rendered = await renderHookWithBasicProvider(() =>
            useForm<SellFormValues>({ validation: sellFormValidationSchema }),
        );

        await act(() => {
            const { setValue } = rendered.result.current;
            setValue('sendAsset', btcAsset);
            setValue('sendAccount', btc1NormalAccount);
            setValue('fiatCurrency', 'eur');
            setValue('amountInCrypto', true);
            setValue('focusedValue', 'cryptoStringAmount');
            setValue('cryptoStringAmount', '0.1');
            setValue('cryptoBaseCurrencyStringAmount', '100');
            setValue('fiatStringAmount', '100');
            setValue('quote', banxaCreditCardSellQuote);
            setValue('generalAlert', 'test');
        });

        return rendered;
    };

    it('should clear quote and amounts and keep the rest of the form', async () => {
        const { result } = await renderFilledSellForm();

        await act(() => {
            resetSellForm(result.current);
        });

        expect(result.current.getValues('quote')).toBeUndefined();
        expect(result.current.getValues('cryptoStringAmount')).toBeUndefined();
        expect(result.current.getValues('cryptoBaseCurrencyStringAmount')).toBeUndefined();
        expect(result.current.getValues('fiatStringAmount')).toBeUndefined();
        expect(result.current.getValues('generalAlert')).toBeUndefined();
        expect(result.current.getValues('sendAsset')).toEqual(btcAsset);
        expect(result.current.getValues('sendAccount')).toEqual(btc1NormalAccount);
        expect(result.current.getValues('fiatCurrency')).toBe('eur');
        expect(result.current.getValues('amountInCrypto')).toBeUndefined();
        expect(result.current.getValues('focusedValue')).toBeUndefined();
    });
});
