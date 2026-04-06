import { useEffect } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { type FormState } from '@suite-common/wallet-types';
import { isInteger } from '@suite-common/wallet-utils';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { InputError } from 'src/components/wallet';

import { FEE_LIMIT } from './constants';

export const CustomFeeTron = () => {
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();

    const { control, getValues, setValue } = useFormContext<FormState>();
    const { errors } = useFormState<FormState>();

    const estimatedFeeLimit = getValues('estimatedFeeLimit');

    useEffect(() => {
        if (getValues(FEE_LIMIT) === '' && estimatedFeeLimit) {
            setValue(FEE_LIMIT, estimatedFeeLimit);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const feeLimitRules = {
        required: translationString('CUSTOM_FEE_IS_NOT_SET'),
        validate: {
            integer: (value: string) => {
                if (!isInteger(value)) {
                    return translationString('CUSTOM_FEE_IS_NOT_INTEGER');
                }
            },
            feeLimit: (value: string) => {
                if (estimatedFeeLimit && new BigNumber(value).lt(estimatedFeeLimit)) {
                    return translationString('TR_TRON_FEE_LIMIT_BELOW_RECOMMENDED');
                }
            },
        },
    };

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
