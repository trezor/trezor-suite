import { useCallback } from 'react';
import { type UseFormReturn, useFormState, useWatch } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';
import { isEip1559 } from '@suite-common/wallet-utils';

import {
    type CustomFeeRules,
    getCustomFeeEthereumRules,
    getCustomFeeRuleError,
} from '#src/components/wallet/Fees/CollapsibleFees/CustomFee/getCustomFeeEthereumRules';

import { type FeesFormValues } from './useFees';

const CUSTOM_FEE_FIELDS = [
    'feeLimit',
    'feePerUnit',
    'maxFeePerGas',
    'maxPriorityFeePerGas',
] as const;

type CustomFeeField = (typeof CUSTOM_FEE_FIELDS)[number];

type CustomFeeForm<TFieldValues extends FeesFormValues> = Pick<
    UseFormReturn<TFieldValues>,
    'control' | 'getValues' | 'setError' | 'trigger'
>;

type UseCustomFeeValidationParams = {
    feeInfo: FeeInfo;
    networkType: NetworkType;
};

/**
 * Guards a submit that reads the fee straight from the form values, so field errors alone never stop it.
 */
export const useCustomFeeValidation = <TFieldValues extends FeesFormValues>(
    form: CustomFeeForm<TFieldValues>,
    { feeInfo, networkType }: UseCustomFeeValidationParams,
) => {
    // Same assertion as in `useFees`: generic field paths do not narrow to the shared fee fields.
    const { control, getValues, setError, trigger } =
        form as unknown as CustomFeeForm<FeesFormValues>;
    const { translationString } = useTranslation();

    const selectedFee = useWatch({ control, name: 'selectedFee' });
    const { errors } = useFormState({ control, name: CUSTOM_FEE_FIELDS });
    // Leaf reads: react-hook-form mutates `errors` in place, so the compiler would freeze the object.
    const hasCustomFeeErrors =
        selectedFee === 'custom' &&
        Boolean(
            errors.feeLimit?.type ||
            errors.feePerUnit?.type ||
            errors.maxFeePerGas?.type ||
            errors.maxPriorityFeePerGas?.type,
        );

    // `trigger` skips unmounted inputs, and a collapsed fee panel unmounts them, so the values are
    // also checked directly against the rules the inputs register.
    const validateCustomFee = useCallback(async () => {
        if (getValues('selectedFee') !== 'custom') return true;

        const isMountedValid = await trigger(CUSTOM_FEE_FIELDS);

        const { gasLimitRules, gasPriceRules, maxFeePerGasRules, maxPriorityFeePerGasRules } =
            getCustomFeeEthereumRules({
                translationString,
                sharedRules: { required: translationString('CUSTOM_FEE_IS_NOT_SET') },
                feeInfo,
                networkType,
                getValues,
            });
        const activeRules: [CustomFeeField, CustomFeeRules][] =
            feeInfo.levels.length && isEip1559(feeInfo.levels[0])
                ? [
                      ['feeLimit', gasLimitRules],
                      ['maxFeePerGas', maxFeePerGasRules],
                      ['maxPriorityFeePerGas', maxPriorityFeePerGasRules],
                  ]
                : [
                      ['feeLimit', gasLimitRules],
                      ['feePerUnit', gasPriceRules],
                  ];

        let isValueValid = true;
        for (const [field, rules] of activeRules) {
            const error = getCustomFeeRuleError(rules, getValues(field));

            if (error) {
                isValueValid = false;
                setError(field, error);
            }
        }

        return isMountedValid && isValueValid;
    }, [feeInfo, networkType, getValues, setError, translationString, trigger]);

    return { hasCustomFeeErrors, validateCustomFee };
};
