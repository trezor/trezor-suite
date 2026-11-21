import { useEffect } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { type FormState } from '@suite-common/wallet-types';
import { NumberInput } from '@trezor/product-components';

import { InputError } from '#src/components/wallet/InputError';
import { useSelector } from '#src/hooks/suite/useSelector';

import { FEE_LIMIT } from './constants';
import { getTronFeeLimitRules } from './getTronFeeLimitRules';
import { useFeesContext } from '../../context/FeesContext';

export const CustomFeeTron = () => {
    const { feeInfo } = useFeesContext();
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();

    const { control, getValues, setValue } = useFormContext<FormState>();
    const { errors } = useFormState<FormState>();

    const estimatedFeeLimit = getValues('estimatedFeeLimit');
    const { maxFee, minFee } = feeInfo;

    useEffect(() => {
        if (getValues(FEE_LIMIT) === '' && estimatedFeeLimit) {
            setValue(FEE_LIMIT, estimatedFeeLimit);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const feeLimitRules = getTronFeeLimitRules({
        translationString,
        minFee,
        maxFee,
        estimatedFeeLimit,
    });

    const useRecommendedButtonProps =
        errors.feeLimit?.type === 'feeLimit'
            ? {
                  onClick: () =>
                      estimatedFeeLimit &&
                      setValue(FEE_LIMIT, estimatedFeeLimit, { shouldValidate: true }),
                  text: translationString('CUSTOM_FEE_USE_RECOMMENDED'),
              }
            : undefined;

    return (
        <NumberInput
            label={<Translation id="TR_TRON_FEE_LIMIT" />}
            locale={locale}
            control={control}
            hasError={!!errors.feeLimit}
            name={FEE_LIMIT}
            data-testid={FEE_LIMIT}
            rules={feeLimitRules}
            bottomText={
                errors.feeLimit?.message ? (
                    <InputError
                        message={errors.feeLimit.message}
                        buttonProps={useRecommendedButtonProps}
                    />
                ) : null
            }
        />
    );
};
