import { useCallback, useMemo } from 'react';

import {
    SLIPPAGE_MAX,
    SLIPPAGE_MIN,
    type SlippageFormValues,
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
    getSlippageFormValidationSchema,
} from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

type SlippageForm = ReturnType<typeof useForm<SlippageFormValues>>;
type UseSlippageFormRet = {
    isValid: SlippageForm['formState']['isValid'];
    handlePresetPress: (preset: string) => void;
    handleSubmit: SlippageForm['handleSubmit'];
    form: SlippageForm;
};

export const useSlippageForm = (): UseSlippageFormRet => {
    const { translate } = useTranslate();

    const validationSchema = useMemo(
        () =>
            yup.object({
                slippage: getSlippageFormValidationSchema({
                    required: translate('moduleTrading.slippage.validation.required'),
                    notNumber: translate('moduleTrading.slippage.validation.notNumber'),
                    outOfRange: translate('moduleTrading.slippage.validation.outOfRange', {
                        min: SLIPPAGE_MIN,
                        max: SLIPPAGE_MAX,
                    }),
                }),
            }),
        [translate],
    );

    const form = useForm<SlippageFormValues>({
        defaultValues: { slippage: TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT },
        validation: validationSchema,
        mode: 'onChange',
    });

    const {
        setValue,
        formState: { isValid },
        handleSubmit,
    } = form;

    const handlePresetPress = useCallback(
        (preset: string) => {
            setValue('slippage', preset, { shouldValidate: true });
        },
        [setValue],
    );

    return { isValid, handlePresetPress, handleSubmit, form };
};
