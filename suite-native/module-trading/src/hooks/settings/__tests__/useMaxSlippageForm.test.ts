import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils/store';

import { useMaxSlippageForm } from '../useMaxSlippageForm';

describe('useMaxSlippageForm', () => {
    const renderUseMaxSlippageForm = (store: TestStore) =>
        renderHookWithStoreProviderAsync(() => useMaxSlippageForm(), { store });

    it('should have default value from store', async () => {
        const { store } = initStore();
        const { result } = await renderUseMaxSlippageForm(store);

        expect(result.current.getValues()).toEqual({
            maxSlippage: '1',
        });
    });

    it.each<string>(['-1', '0', '0.009', '50.1', '55', '', 'invalid_number'])(
        'should error validation for value %s',
        async slippage => {
            const { store } = initStore();
            const { result } = await renderUseMaxSlippageForm(store);

            await act(async () => {
                result.current.setValue('maxSlippage', slippage, { shouldValidate: true });
                await Promise.resolve(); // wait for validation to complete
            });

            const { error, invalid } = result.current.getFieldState('maxSlippage');

            expect(invalid).toBe(true);
            expect(error?.message).toBe('Slippage must be between 0.01 and 50');
        },
    );

    it.each(['0.01', '1', '12.34', '50'])('should pass validation for value %s', async slippage => {
        const { store } = initStore();
        const { result } = await renderUseMaxSlippageForm(store);

        act(() => {
            result.current.setValue('maxSlippage', slippage, { shouldValidate: true });
        });

        const { invalid } = result.current.getFieldState('maxSlippage');

        expect(invalid).toBe(false);
    });
});
