import { Form } from '@suite-native/forms';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import { type BuyFormType } from '@suite-native/trading-types';

import { renderHookWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { useBuyForm } from '../useBuyForm';
import { useBuyInputFormControls } from '../useBuyInputFormControls';

describe('useBuyInputFormControls', () => {
    let form: BuyFormType;

    const renderBuyFormHook = () => renderHookWithTradingProvider(() => useBuyForm());

    const renderUseBuyInputFormControls = () =>
        renderHookWithBasicProvider(() => useBuyInputFormControls('fiatValue'), {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderBuyFormHook();
        form = result.current;
    });

    it('should use value from given form field', () => {
        form.setValue('fiatValue', '123');

        const { result } = renderUseBuyInputFormControls();

        expect(result.current.value).toEqual('123');
    });

    it('should return correct structure', () => {
        const { result } = renderUseBuyInputFormControls();

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
