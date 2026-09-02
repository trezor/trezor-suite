import { Form } from '@suite-native/forms';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellForm } from './useSellForm';
import { useSellInputFormControls } from './useSellInputFormControls';
import { renderHookWithTradingProvider } from '../../test-utils/tradingTestUtils';

describe('useSellInputFormControls', () => {
    let form: SellFormType;

    const renderSellFormHook = async () =>
        await renderHookWithTradingProvider(() => useSellForm(), { tradeType: 'sell' });

    const renderUseSellInputFormControls = async (
        name: 'fiatStringAmount' | 'cryptoStringAmount' = 'fiatStringAmount',
    ) =>
        await renderHookWithBasicProvider(() => useSellInputFormControls(name), {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderSellFormHook();
        form = result.current;
    });

    it('should use value from given form field', async () => {
        form.setValue('fiatStringAmount', '123');

        const { result } = await renderUseSellInputFormControls();

        expect(result.current.value).toEqual('123');
    });

    it('should return correct structure', async () => {
        const { result } = await renderUseSellInputFormControls();

        expect(result.current).toEqual(
            expect.objectContaining({
                value: '',
                onChangeText: expect.any(Function),
                onBlur: expect.any(Function),
                hasError: false,
            }),
        );
    });

    it('should keep onChangeText stable when the value changes', async () => {
        const { result } = await renderUseSellInputFormControls();
        const initialOnChangeText = result.current.onChangeText;

        await act(() => form.setValue('fiatStringAmount', '123'));

        expect(result.current.onChangeText).toBe(initialOnChangeText);
    });

    it('should switch to fiat amount and clear crypto amount on fiat input change', async () => {
        form.setValue('amountInCrypto', true);
        form.setValue('cryptoStringAmount', '0.1');
        const { result } = await renderUseSellInputFormControls('fiatStringAmount');

        await act(() => result.current.onChangeText('100'));

        expect(form.getValues('fiatStringAmount')).toBe('100');
        expect(form.getValues('cryptoStringAmount')).toBeUndefined();
        expect(form.getValues('amountInCrypto')).toBe(false);
    });

    it('should switch to crypto amount and clear fiat amount on crypto input change', async () => {
        form.setValue('amountInCrypto', false);
        form.setValue('fiatStringAmount', '100');
        const { result } = await renderUseSellInputFormControls('cryptoStringAmount');

        await act(() => result.current.onChangeText('0.1'));

        expect(form.getValues('cryptoStringAmount')).toBe('0.1');
        expect(form.getValues('fiatStringAmount')).toBeUndefined();
        expect(form.getValues('amountInCrypto')).toBe(true);
    });
});
