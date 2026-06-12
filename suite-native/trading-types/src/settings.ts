import type { UseFormReturn } from '@suite-native/forms';

// TODO use common interface
export type MaxSlippageFormValues = {
    maxSlippage: string;
};

export type MaxSlippageFormType = UseFormReturn<MaxSlippageFormValues>;
