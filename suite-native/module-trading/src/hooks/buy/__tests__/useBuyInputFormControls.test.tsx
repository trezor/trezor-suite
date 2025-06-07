import { Form } from '@suite-native/forms';
import {
    renderHookWithBasicProvider,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { BuyFormType } from '../../../types/buy';
import { useBuyForm } from '../useBuyForm';
import { useBuyInputFormControls } from '../useBuyInputFormControls';

describe('useBuyInputFormControls', () => {
    let form: BuyFormType;

    const renderBuyFormHook = () => renderHookWithStoreProviderAsync(() => useBuyForm());

    const renderUseBuyInputFormControls = () =>
        renderHookWithBasicProvider(() => useBuyInputFormControls('fiatValue'), {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderBuyFormHook();
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
