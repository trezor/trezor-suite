import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
    userEvent,
} from '@suite-native/test-utils';
import { paletteV1 } from '@trezor/theme';

import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import { TradingAmountInput, TradingAmountInputProps } from '../TradingAmountInput';

describe('TradingAmountInput', () => {
    const renderBuyFormHook = () => renderHookWithStoreProviderAsync(() => useTradingBuyForm());
    const renderTradingAmountInput = (
        props: Partial<TradingAmountInputProps>,
        form: TradingBuyForm,
    ) =>
        renderWithBasicProvider(
            <Form form={form}>
                <TradingAmountInput
                    name="fiatValue"
                    inputTransformer={v => v}
                    accessibilityLabel="INPUT"
                    {...props}
                />
            </Form>,
        );

    it('should respect maxLength property', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({ maxLength: 5 }, result.current);

        await userEvent.type(getByLabelText('INPUT'), '1234567890');

        expect(getByLabelText('INPUT')).toHaveDisplayValue('12345');
        expect(result.current.getValues('fiatValue')).toBe('12345');
    });

    it('should have no limit by default', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        await userEvent.type(
            getByLabelText('INPUT'),
            '12345678901234567890123456789012345678901234567890',
        );

        expect(getByLabelText('INPUT')).toHaveDisplayValue(
            '12345678901234567890123456789012345678901234567890',
        );
        expect(result.current.getValues('fiatValue')).toBe(
            '12345678901234567890123456789012345678901234567890',
        );
    });

    it('should call onChange with undefined instead of empty text', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        await userEvent.type(getByLabelText('INPUT'), '1234567890');
        expect(getByLabelText('INPUT')).toHaveDisplayValue('1234567890');

        await userEvent.clear(getByLabelText('INPUT'));
        expect(getByLabelText('INPUT')).toHaveDisplayValue('');
        expect(result.current.getValues('fiatValue')).toBe(undefined);
    });

    it('should have default color for valid input value', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        await userEvent.type(getByLabelText('INPUT'), '1');

        expect(getByLabelText('INPUT')).toHaveStyle({ color: paletteV1.lightGray1000 });
    });

    it('should have alert color for invalid input value', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        await userEvent.type(getByLabelText('INPUT'), '1');
        act(() => {
            result.current.setError('fiatValue', { message: 'ERROR' });
        });

        expect(getByLabelText('INPUT')).toHaveStyle({ color: paletteV1.lightAccentRed700 });
    });
});
