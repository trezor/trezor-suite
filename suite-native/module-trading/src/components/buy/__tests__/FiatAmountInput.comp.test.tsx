import { Form } from '@suite-native/forms';
import {
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';

import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import { FiatAmountInput } from '../FiatAmountInput';

describe('FiatAmountInput', () => {
    const renderFiatAmountInput = (form: TradingBuyForm) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <FiatAmountInput />
            </Form>,
        );

    it('should set fiat value in form', async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        const { getByLabelText } = await renderFiatAmountInput(result.current);

        await userEvent.type(getByLabelText('You pay'), '100');

        expect(result.current.getValues('fiatValue')).toEqual('100');
    });

    it('should format input value to be decimal', async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        const { getByLabelText } = await renderFiatAmountInput(result.current);

        await userEvent.type(getByLabelText('You pay'), 'asd1.123');

        expect(result.current.getValues('fiatValue')).toEqual('1.123');
    });
});
