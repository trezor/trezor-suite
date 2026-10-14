import type { ExchangeTrade } from 'invity-api';

import { useForm } from '@suite-native/forms';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import {
    btc1NormalAccount,
    btcAsset,
    eth1NormalAccount,
    ethAsset,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormValues } from '@suite-native/trading-types';

import { resetExchangeForm } from './exchangeFormResetUtils';
import { exchangeFormValidationSchema } from './exchangeFormValidationSchema';

describe('resetExchangeForm', () => {
    const receiveAccount = { account: eth1NormalAccount };

    const renderFilledExchangeForm = async () => {
        const rendered = await renderHookWithBasicProvider(() =>
            useForm<ExchangeFormValues>({ validation: exchangeFormValidationSchema }),
        );

        await act(() => {
            const { setValue } = rendered.result.current;
            setValue('sendAsset', btcAsset);
            setValue('sendAccount', btc1NormalAccount);
            setValue('receiveAsset', ethAsset);
            setValue('receiveAccount', receiveAccount);
            setValue('focusedValue', 'sendCryptoAmount');
            setValue('quote', mercuryoFixedWorstQuote as ExchangeTrade);
            setValue('sendCryptoAmount', '10');
            setValue('sendBaseCurrencyAmount', '100');
            setValue('receiveCryptoAmount', '10');
            setValue('generalAlert', 'test');
        });

        return rendered;
    };

    it('should clear quote and amounts and keep the rest of the form', async () => {
        const { result } = await renderFilledExchangeForm();

        await act(() => {
            resetExchangeForm(result.current);
        });

        expect(result.current.getValues('quote')).toBeUndefined();
        expect(result.current.getValues('sendCryptoAmount')).toBeUndefined();
        expect(result.current.getValues('sendBaseCurrencyAmount')).toBeUndefined();
        expect(result.current.getValues('receiveCryptoAmount')).toBeUndefined();
        expect(result.current.getValues('generalAlert')).toBeUndefined();
        expect(result.current.getValues('sendAsset')).toEqual(btcAsset);
        expect(result.current.getValues('sendAccount')).toEqual(btc1NormalAccount);
        expect(result.current.getValues('receiveAsset')).toEqual(ethAsset);
        expect(result.current.getValues('receiveAccount')).toEqual(receiveAccount);
        expect(result.current.getValues('focusedValue')).toBeUndefined();
    });
});
