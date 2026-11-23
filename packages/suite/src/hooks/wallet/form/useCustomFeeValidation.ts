import { useCallback } from 'react';
import { type UseFormReturn, useFormState, useWatch } from 'react-hook-form';

import { type FeesFormValues } from './useFees';

const CUSTOM_FEE_FIELDS = [
    'feeLimit',
    'feePerUnit',
    'maxFeePerGas',
    'maxPriorityFeePerGas',
] as const;

type CustomFeeForm<TFieldValues extends FeesFormValues> = Pick<
    UseFormReturn<TFieldValues>,
    'control' | 'getValues' | 'trigger'
>;

/**
 * Guards a submit that reads the fee straight from the form values, so field errors alone never stop it.
 */
export const useCustomFeeValidation = <TFieldValues extends FeesFormValues>(
    form: CustomFeeForm<TFieldValues>,
) => {
    // Same assertion as in `useFees`: generic field paths do not narrow to the shared fee fields.
    const { control, getValues, trigger } = form as unknown as CustomFeeForm<FeesFormValues>;

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

    // Values set by `setValue` stay unvalidated until touched. Unmounted inputs are skipped, so this
    // validates only the active fee kind.
    const validateCustomFee = useCallback(() => {
        if (getValues('selectedFee') !== 'custom') return Promise.resolve(true);

        return trigger(CUSTOM_FEE_FIELDS);
    }, [getValues, trigger]);

    return { hasCustomFeeErrors, validateCustomFee };
};
