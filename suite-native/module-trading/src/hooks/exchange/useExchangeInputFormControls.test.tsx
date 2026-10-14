import { Form } from '@suite-native/forms';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from './useExchangeForm';
import { useExchangeInputFormControls } from './useExchangeInputFormControls';
import { renderHookWithTradingProvider } from '../../test-utils/tradingTestUtils';

describe('useExchangeInputFormControls', () => {
    let form: ExchangeFormType;

    const renderUseExchangeInputFormControls = async () =>
        await renderHookWithBasicProvider(() => useExchangeInputFormControls(), {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
        });
        form = result.current;
    });

    it('should use value from send crypto amount field', async () => {
        form.setValue('sendCryptoAmount', '0.5');

        const { result } = await renderUseExchangeInputFormControls();

        expect(result.current.value).toBe('0.5');
    });

    it('should keep onChangeText stable when the value changes', async () => {
        const { result } = await renderUseExchangeInputFormControls();
        const initialOnChangeText = result.current.onChangeText;

        await act(() => form.setValue('sendCryptoAmount', '0.5'));

        expect(result.current.onChangeText).toBe(initialOnChangeText);
    });

    it('should set crypto amount and clear typed base currency amount on change', async () => {
        form.setValue('sendBaseCurrencyAmount', '100');
        const { result } = await renderUseExchangeInputFormControls();

        await act(() => result.current.onChangeText('0.1'));

        expect(form.getValues('sendCryptoAmount')).toBe('0.1');
        expect(form.getValues('sendBaseCurrencyAmount')).toBeUndefined();
    });
});
