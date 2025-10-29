import { FieldPath } from 'react-hook-form';

import { FormState } from '@suite-common/wallet-types';

export const FEE_PER_UNIT = 'feePerUnit' satisfies FieldPath<FormState>;
export const FEE_LIMIT = 'feeLimit' satisfies FieldPath<FormState>;
