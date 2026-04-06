import { useSelector } from 'react-redux';

import { yup } from '@suite-common/validators';
import { selectDustPhishingThreshold } from '@suite-common/wallet-core';
import { useForm } from '@suite-native/forms';
import { type Translate, useTranslate } from '@suite-native/intl';

const validateIsEmpty = (value?: string) => {
    if (!value || value.trim() === '') return false;

    return true;
};

const validateIsNumber = (value?: string) => {
    if (!value || value.trim() === '') return false;
    const number = Number(value.trim());

    return !isNaN(number);
};

const validateIsPositiveNumber = (value?: string) => {
    if (!value || value.trim() === '') return false;
    const number = Number(value.trim());

    return !isNaN(number) && number > 0;
};

const getDustThresholdValidation = (translate: Translate) =>
    yup
        .string()
        .test({
            name: 'is-empty',
            message: translate('moduleSettings.advanced.dustPhishing.errors.empty'),
            test: validateIsEmpty,
        })
        .test({
            name: 'is-valid-number',
            message: translate('moduleSettings.advanced.dustPhishing.errors.number'),
            test: validateIsNumber,
        })
        .test({
            name: 'is-positive-number',
            message: translate('moduleSettings.advanced.dustPhishing.errors.positive'),
            test: validateIsPositiveNumber,
        });

export const useDustPhishingForm = () => {
    const { translate } = useTranslate();

    const dustPhishingThreshold = useSelector(selectDustPhishingThreshold);

    const form = useForm<{ dustThreshold: string }>({
        mode: 'onChange',
        defaultValues: {
            dustThreshold: dustPhishingThreshold ?? '',
        },
        validation: yup.object({
            dustThreshold: getDustThresholdValidation(translate),
        }),
    });

    const dustThreshold = form.watch('dustThreshold');

    const { isValid } = form.formState;
    const isSame = dustThreshold.trim() === dustPhishingThreshold;
    const isDisabled = !isValid || isSame;

    return {
        form,
        isDisabled,
    };
};
