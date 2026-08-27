import { Form } from '@suite-native/forms';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from './useBuyForm';
import { useBuyInputFormControls } from './useBuyInputFormControls';
import { renderHookWithTradingProvider } from '../../test-utils/tradingTestUtils';

describe('useBuyInputFormControls', () => {
    let form: BuyFormType;

    const renderBuyFormHook = async () => await renderHookWithTradingProvider(() => useBuyForm());

    const renderUseBuyInputFormControls = async (name: 'fiatValue' | 'cryptoValue' = 'fiatValue') =>
        await renderHookWithBasicProvider(() => useBuyInputFormControls(name), {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderBuyFormHook();
        form = result.current;
    });

    it('should use value from given form field', async () => {
        form.setValue('fiatValue', '123');

        const { result } = await renderUseBuyInputFormControls();

        expect(result.current.value).toEqual('123');
    });

    it('should return correct structure', async () => {
        const { result } = await renderUseBuyInputFormControls();

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
        const { result } = await renderUseBuyInputFormControls();
        const initialOnChangeText = result.current.onChangeText;

        await act(() => form.setValue('fiatValue', '123'));

        expect(result.current.onChangeText).toBe(initialOnChangeText);
    });

    it('should switch to fiat amount and clear crypto amount on fiat input change', async () => {
        form.setValue('amountInCrypto', true);
        form.setValue('cryptoValue', '0.1');
        const { result } = await renderUseBuyInputFormControls('fiatValue');

        await act(() => result.current.onChangeText('100'));

        expect(form.getValues('fiatValue')).toBe('100');
        expect(form.getValues('cryptoValue')).toBeUndefined();
        expect(form.getValues('amountInCrypto')).toBe(false);
    });

    it('should switch to crypto amount and clear fiat amount on crypto input change', async () => {
        form.setValue('amountInCrypto', false);
        form.setValue('fiatValue', '100');
        const { result } = await renderUseBuyInputFormControls('cryptoValue');

        await act(() => result.current.onChangeText('0.1'));

        expect(form.getValues('cryptoValue')).toBe('0.1');
        expect(form.getValues('fiatValue')).toBeUndefined();
        expect(form.getValues('amountInCrypto')).toBe(true);
    });
});
