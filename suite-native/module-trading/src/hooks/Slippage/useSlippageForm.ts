import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    SLIPPAGE_MAX,
    SLIPPAGE_MIN,
    type SlippageFormValues,
    getSlippageFormValidationSchema,
    selectTradingMaxSlippagePercentage,
} from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

type SlippageForm = ReturnType<typeof useForm<SlippageFormValues>>;
type UseSlippageFormRet = {
    isValid: SlippageForm['formState']['isValid'];
    handlePresetPress: (preset: string) => void;
    handleSubmit: SlippageForm['handleSubmit'];
    reset: SlippageForm['reset'];
    form: SlippageForm;
};

export const useSlippageForm = (): UseSlippageFormRet => {
    const { translate } = useTranslate();
    const defaultSlippage = useSelector(selectTradingMaxSlippagePercentage);

    const validationSchema = useMemo(
        () =>
            yup.object({
                slippage: getSlippageFormValidationSchema({
                    required: translate(
                        'moduleTrading.advancedSettings.slippage.validation.required',
                    ),
                    notNumber: translate(
                        'moduleTrading.advancedSettings.slippage.validation.notNumber',
                    ),
                    outOfRange: translate(
                        'moduleTrading.advancedSettings.slippage.validation.outOfRange',
                        { min: SLIPPAGE_MIN, max: SLIPPAGE_MAX },
                    ),
                }),
            }),
        [translate],
    );

    const form = useForm<SlippageFormValues>({
        defaultValues: { slippage: defaultSlippage },
        validation: validationSchema,
    });

    const {
        setValue,
        trigger,
        formState: { isValid },
        handleSubmit,
        reset,
    } = form;

    const handlePresetPress = useCallback(
        (preset: string) => {
            setValue('slippage', preset);
            trigger('slippage');
        },
        [setValue, trigger],
    );

    return { isValid, handlePresetPress, handleSubmit, reset, form };
};
