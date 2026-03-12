import { Form } from '@suite-native/forms';
import { userEvent } from '@suite-native/test-utils';
import { type PreloadedState, renderHookWithStoreProviderAsync, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellFiatAmountInput } from '../SellFiatAmountInput';

describe('SellFiatAmountInput', () => {
    const renderFiatAmountInput = (form: SellFormType, preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <SellFiatAmountInput />
            </Form>,
            { preloadedState },
        );

    const renderUseTradingSellForm = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useSellForm(), {
            preloadedState,
        });

        return result.current;
    };

    it('should set fiat value in form', async () => {
        const form = await renderUseTradingSellForm();
        const { getByLabelText } = await renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You get'), '100');

        expect(form.getValues('fiatStringAmount')).toEqual('100');
    });

    it('should format input value to be decimal', async () => {
        const form = await renderUseTradingSellForm();
        const { getByLabelText } = await renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You get'), 'asd1.123');

        expect(form.getValues('fiatStringAmount')).toEqual('1.123');
        expect(getByLabelText('You get')).toHaveDisplayValue('1.123');
    });

    it('should always escape non-numeric characters', async () => {
        const form = await renderUseTradingSellForm();
        const { getByLabelText } = await renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You get'), 'asd');

        expect(form.getValues('fiatStringAmount')).toBeUndefined();
        expect(getByLabelText('You get')).toHaveDisplayValue('');
    });

    it('should limit value to 3 decimals', async () => {
        const form = await renderUseTradingSellForm();
        const { getByLabelText } = await renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You get'), '1.0123456789');

        expect(form.getValues('fiatStringAmount')).toEqual('1.012');
    });
});
