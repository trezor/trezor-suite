import { useEffect } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { type FormState } from '@suite-common/wallet-types';
import { isInteger } from '@suite-common/wallet-utils';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { FEE_LIMIT } from '#src/components/wallet/Fees/CollapsibleFees/CustomFee/constants';
import { useFeesContext } from '#src/components/wallet/Fees/context/FeesContext';
import { InputError } from '#src/components/wallet/InputError';

export type TradingExchangeTronFeeLimitProps = {
    composeRequest: (field: typeof FEE_LIMIT) => void;
};

export const TradingExchangeTronFeeLimit = ({
    composeRequest,
}: TradingExchangeTronFeeLimitProps) => {
    const locale = useSelector(selectLanguage);

    const { feeInfo, selectedFee, changeFeeLevel } = useFeesContext();
    const { translationString } = useTranslation();
    const { control, setValue } = useFormContext<FormState>();
    const { errors } = useFormState<FormState>();
    const estimatedFeeLimit = useWatch<FormState, 'estimatedFeeLimit'>({
        name: 'estimatedFeeLimit',
    });

    const isCustom = selectedFee === 'custom';
    const { maxFee, minFee } = feeInfo;

    useEffect(() => {
        if (!isCustom && estimatedFeeLimit) {
            setValue(FEE_LIMIT, estimatedFeeLimit);
        }
    }, [isCustom, estimatedFeeLimit, setValue]);

    const handleChange = (value: string) => {
        if (isCustom) {
            return;
        }

        changeFeeLevel('custom');
        setValue(FEE_LIMIT, value, { shouldValidate: true });
        composeRequest(FEE_LIMIT);
    };

    const feeLimitRules = {
        required: translationString('CUSTOM_FEE_IS_NOT_SET'),
        validate: {
            integer: (value: string) => {
                if (!isInteger(value)) {
                    return translationString('CUSTOM_FEE_IS_NOT_INTEGER');
                }
            },
            range: (value: string) => {
                const customFee = new BigNumber(value);

                if (customFee.isGreaterThan(maxFee) || customFee.isLessThan(minFee)) {
                    return translationString('CUSTOM_FEE_NOT_IN_RANGE', {
                        minFee: new BigNumber(minFee).toString(),
                        maxFee: new BigNumber(maxFee).toString(),
                    });
                }
            },
            feeLimit: (value: string) => {
                if (estimatedFeeLimit && new BigNumber(value).lt(estimatedFeeLimit)) {
                    return translationString('TR_TRON_FEE_LIMIT_BELOW_RECOMMENDED');
                }
            },
        },
    };

    const useRecommendedButtonProps = isCustom
        ? {
              onClick: () => changeFeeLevel('normal'),
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
            onChange={handleChange}
            bottomText={
                errors.feeLimit?.message || isCustom ? (
                    <InputError
                        message={errors.feeLimit?.message}
                        buttonProps={useRecommendedButtonProps}
                    />
                ) : null
            }
        />
    );
};
