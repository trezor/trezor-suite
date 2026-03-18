import {
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';

import { useMaxSlippageForm } from '../useMaxSlippageForm';

describe('useMaxSlippageForm', () => {
    const renderUseMaxSlippageForm = (store: TestStore) =>
        renderHookWithStoreProvider(() => useMaxSlippageForm(), { store });

    it('should have default value from store', () => {
        const { store } = initStore();
        const { result } = renderUseMaxSlippageForm(store);

        expect(result.current.getValues()).toEqual({
            maxSlippage: '1',
        });
    });

    it.each<string>(['-1', '0', '0.009', '50.1', '55', '', 'invalid_number'])(
        'should error validation for value %s',
        async slippage => {
            const { store } = initStore();
            const { result } = renderUseMaxSlippageForm(store);

            await act(async () => {
                result.current.setValue('maxSlippage', slippage, { shouldValidate: true });
                await Promise.resolve(); // wait for validation to complete
            });

            const { error, invalid } = result.current.getFieldState('maxSlippage');

            expect(invalid).toBe(true);
            expect(error?.message).toBe('Slippage must be between 0.01 and 50');
        },
    );

    it.each(['0.01', '1', '12.34', '50'])('should pass validation for value %s', slippage => {
        const { store } = initStore();
        const { result } = renderUseMaxSlippageForm(store);

        act(() => {
            result.current.setValue('maxSlippage', slippage, { shouldValidate: true });
        });

        const { invalid } = result.current.getFieldState('maxSlippage');

        expect(invalid).toBe(false);
    });
});
