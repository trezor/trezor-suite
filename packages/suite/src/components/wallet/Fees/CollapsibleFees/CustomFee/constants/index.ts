import { type FieldPath } from 'react-hook-form';

import { type FormState } from '@suite-common/wallet-types';

export const FEE_PER_UNIT = 'feePerUnit' satisfies FieldPath<FormState>;
export const FEE_LIMIT = 'feeLimit' satisfies FieldPath<FormState>;
export const MAX_FEE_PER_GAS = 'maxFeePerGas' satisfies FieldPath<FormState>;
export const MAX_PRIORITY_FEE_PER_GAS = 'maxPriorityFeePerGas' satisfies FieldPath<FormState>;
