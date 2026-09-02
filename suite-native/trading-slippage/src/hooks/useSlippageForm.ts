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
    isSubmitting: SlippageForm['formState']['isSubmitting'];
    handlePresetPress: (preset: string) => void;
    handleSubmit: SlippageForm['handleSubmit'];
    form: SlippageForm;
};

export const useSlippageForm = (
    initialSlippage = TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
): UseSlippageFormRet => {
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
        defaultValues: { slippage: initialSlippage },
        validation: validationSchema,
        mode: 'onChange',
    });

    const {
        setValue,
        formState: { isSubmitting, isValid },
        handleSubmit,
    } = form;

    const handlePresetPress = useCallback(
        (preset: string) => {
            setValue('slippage', preset, { shouldValidate: true });
        },
        [setValue],
    );

    return { isSubmitting, isValid, handlePresetPress, handleSubmit, form };
};
