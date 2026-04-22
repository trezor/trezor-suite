import { Form } from '@suite-native/forms';
import { renderHookWithProviders } from '@suite-native/test-utils';
import { type SellFormType } from '@suite-native/trading-types';

import { renderHookWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { useSellForm } from '../useSellForm';
import { useSellInputFormControls } from '../useSellInputFormControls';

describe('useSellInputFormControls', () => {
    let form: SellFormType;

    const renderSellFormHook = () =>
        renderHookWithTradingProvider(() => useSellForm(), { tradeType: 'sell' });

    const renderUseSellInputFormControls = () =>
        renderHookWithProviders(() => useSellInputFormControls('fiatStringAmount'), {
            providers: ['intl'],
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderSellFormHook();
        form = result.current;
    });

    it('should use value from given form field', () => {
        form.setValue('fiatStringAmount', '123');

        const { result } = renderUseSellInputFormControls();

        expect(result.current.value).toEqual('123');
    });

    it('should return correct structure', () => {
        const { result } = renderUseSellInputFormControls();

        expect(result.current).toEqual(
            expect.objectContaining({
                value: '',
                onChangeText: expect.any(Function),
                onBlur: expect.any(Function),
                hasError: false,
            }),
        );
    });
});
