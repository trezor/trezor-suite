import {
    SLIPPAGE_PRESETS,
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
} from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils-store';

import { renderHookWithSlippageTestProvider } from '../../__tests__/testUtils';
import { useSlippageForm } from '../useSlippageForm';

describe('useSlippageForm', () => {
    const renderUseSlippageForm = async () => {
        const ret = renderHookWithSlippageTestProvider(() => useSlippageForm());
        // wait for form validation
        await act(() => Promise.resolve());

        return ret;
    };

    it('should initialize slippage with the static default value', async () => {
        const { result } = await renderUseSlippageForm();

        expect(result.current.form.getValues('slippage')).toBe(
            TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
        );
    });

    it('should set slippage to preset value when handlePresetPress is called', async () => {
        const { result } = await renderUseSlippageForm();

        await act(async () => {
            result.current.handlePresetPress(SLIPPAGE_PRESETS[1]!);
            // wait for form validation
            await Promise.resolve();
        });

        expect(result.current.form.getValues('slippage')).toBe(SLIPPAGE_PRESETS[1]);
    });

    describe('validation', () => {
        it('should show required error when slippage is empty', async () => {
            const { result } = await renderUseSlippageForm();

            await act(async () => {
                result.current.form.setValue('slippage', '');
                await result.current.form.trigger('slippage');
            });

            const { error } = result.current.form.getFieldState('slippage');

            expect(error?.message).toBe(
                getTranslation('moduleTrading.slippage.validation.required'),
            );
        });
    });
});
