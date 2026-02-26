import { Form } from '@suite-native/forms';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../useSellForm';
import { useSellInputFormControls } from '../useSellInputFormControls';

describe('useSellInputFormControls', () => {
    let form: SellFormType;

    const renderSellFormHook = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderUseSellInputFormControls = () =>
        renderHookWithBasicProvider(() => useSellInputFormControls('fiatStringAmount'), {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderSellFormHook();
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
