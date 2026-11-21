import { useEffect } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { type FormState } from '@suite-common/wallet-types';
import { NumberInput } from '@trezor/product-components';

import { FEE_LIMIT } from '#src/components/wallet/Fees/CollapsibleFees/CustomFee/constants';
import { getTronFeeLimitRules } from '#src/components/wallet/Fees/CollapsibleFees/CustomFee/getTronFeeLimitRules';
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

    const feeLimitRules = getTronFeeLimitRules({
        translationString,
        minFee,
        maxFee,
        estimatedFeeLimit,
    });

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
