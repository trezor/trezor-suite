import type { UseFormReturn } from '@suite-native/forms';

export type MaxSlippageFormValues = {
    maxSlippage: string;
};

export type MaxSlippageFormType = UseFormReturn<MaxSlippageFormValues>;
