import { type UseFormReturn } from 'react-hook-form';

import { type FormState } from '@suite-common/wallet-types';

export type AllowanceFeeValues = Pick<
    FormState,
    'selectedFee' | 'feePerUnit' | 'feeLimit' | 'maxFeePerGas' | 'maxPriorityFeePerGas'
>;

export const getAllowanceFeeValues = ({
    getValues,
}: UseFormReturn<FormState>): AllowanceFeeValues => {
    const { selectedFee, feePerUnit, feeLimit, maxFeePerGas, maxPriorityFeePerGas } = getValues();

    return { selectedFee, feePerUnit, feeLimit, maxFeePerGas, maxPriorityFeePerGas };
};

export const setAllowanceFeeValues = (
    { setValue }: UseFormReturn<FormState>,
    feeValues: AllowanceFeeValues,
) => {
    setValue('selectedFee', feeValues.selectedFee);
    setValue('feePerUnit', feeValues.feePerUnit);
    setValue('feeLimit', feeValues.feeLimit);
    setValue('maxFeePerGas', feeValues.maxFeePerGas);
    setValue('maxPriorityFeePerGas', feeValues.maxPriorityFeePerGas);
};
