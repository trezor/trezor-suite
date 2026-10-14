import { useForm } from '@suite-native/forms';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import {
    btc1NormalAccount,
    btcAsset,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';
import { type BuyFormValues } from '@suite-native/trading-types';

import { resetBuyForm } from './buyFormResetUtils';
import { buyFormValidationSchema } from './buyFormValidationSchema';

describe('resetBuyForm', () => {
    const receiveAccount = { account: btc1NormalAccount };

    const renderFilledBuyForm = async () => {
        const rendered = await renderHookWithBasicProvider(() =>
            useForm<BuyFormValues>({ validation: buyFormValidationSchema }),
        );

        await act(() => {
            const { setValue } = rendered.result.current;
            setValue('asset', btcAsset);
            setValue('receiveAccount', receiveAccount);
            setValue('fiatCurrency', 'eur');
            setValue('amountInCrypto', true);
            setValue('focusedValue', 'fiatValue');
            setValue('fiatValue', '10');
            setValue('cryptoValue', '10');
            setValue('cryptoBaseCurrencyValue', '10');
            setValue('quote', mercuryoApplePayBuyQuote);
            setValue('generalAlert', 'test');
        });

        return rendered;
    };

    it('should clear quote and amounts and keep the rest of the form', async () => {
        const { result } = await renderFilledBuyForm();

        await act(() => {
            resetBuyForm(result.current);
        });

        expect(result.current.getValues('quote')).toBeUndefined();
        expect(result.current.getValues('fiatValue')).toBeUndefined();
        expect(result.current.getValues('cryptoValue')).toBeUndefined();
        expect(result.current.getValues('cryptoBaseCurrencyValue')).toBeUndefined();
        expect(result.current.getValues('generalAlert')).toBeUndefined();
        expect(result.current.getValues('asset')).toEqual(btcAsset);
        expect(result.current.getValues('receiveAccount')).toEqual(receiveAccount);
        expect(result.current.getValues('fiatCurrency')).toBe('eur');
        expect(result.current.getValues('amountInCrypto')).toBeUndefined();
        expect(result.current.getValues('focusedValue')).toBeUndefined();
    });
});
