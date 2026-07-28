import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { type SellFormType } from '@suite-native/trading-types';

import { SellFiatAmountInput } from './SellFiatAmountInput';
import {
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../hooks/sell/useSellForm';

describe('SellFiatAmountInput', () => {
    const renderFiatAmountInput = (form: SellFormType) =>
        renderWithTradingProvider(
            <Form form={form}>
                <SellFiatAmountInput />
            </Form>,
            { tradeType: 'sell' },
        );

    const renderUseTradingSellForm = () => {
        const { result } = renderHookWithTradingProvider(() => useSellForm(), {
            tradeType: 'sell',
        });

        return result.current;
    };

    it('should set fiat value in form', async () => {
        const form = renderUseTradingSellForm();
        const { getByLabelText } = renderFiatAmountInput(form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            '100',
        );

        expect(form.getValues('fiatStringAmount')).toEqual('100');
    });

    it('should format input value to be decimal', async () => {
        const form = renderUseTradingSellForm();
        const { getByLabelText } = renderFiatAmountInput(form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            'asd1.123',
        );

        expect(form.getValues('fiatStringAmount')).toEqual('1.123');
        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
        ).toHaveDisplayValue('1.123');
    });

    it('should always escape non-numeric characters', async () => {
        const form = renderUseTradingSellForm();
        const { getByLabelText } = renderFiatAmountInput(form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            'asd',
        );

        expect(form.getValues('fiatStringAmount')).toBeUndefined();
        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
        ).toHaveDisplayValue('');
    });

    it('should limit value to 3 decimals', async () => {
        const form = renderUseTradingSellForm();
        const { getByLabelText } = renderFiatAmountInput(form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            '1.0123456789',
        );

        expect(form.getValues('fiatStringAmount')).toEqual('1.012');
    });
});
