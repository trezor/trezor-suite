import { UINT256_MAX } from '@suite-common/suite-constants';
import { type AmountSubunit } from '@suite-common/wallet-utils';

import { type ContextWith } from '../../types/validation';
import { type InspectFn, type ValidateFn, createValidator } from '../createValidator';

export const isNegative: ValidateFn<AmountSubunit> = input =>
    input.isNegative() ? 'NEGATIVE_AMOUNT' : null;

export const isNotInteger: ValidateFn<AmountSubunit> = input =>
    input.isInteger() ? null : 'NOT_INTEGER';

export const exceedsUint256: ValidateFn<AmountSubunit> = input =>
    input.gt(UINT256_MAX) ? 'EXCEEDS_UINT256' : null;

export const isZero: InspectFn<bigint> = input => (input === 0n ? 'ZERO_AMOUNT' : null);

type BalanceContext = ContextWith<{ balance?: bigint }>;

export const hasBalance: InspectFn<bigint, BalanceContext> = (input, context) =>
    context?.balance !== undefined && input > context.balance ? 'INSUFFICIENT_BALANCE' : null;

export const validateUint256 = createValidator<AmountSubunit, bigint, BalanceContext>({
    validate: [isNegative, isNotInteger, exceedsUint256],
    normalize: input => BigInt(input.toFixed(0)),
    inspect: [isZero, hasBalance],
});
