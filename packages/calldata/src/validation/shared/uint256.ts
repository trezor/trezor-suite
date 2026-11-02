import { BigNumber } from '@trezor/utils';

import { type ContextWith } from '../../types/validation';
import { type InspectFn, type ValidateFn, createValidator } from '../createValidator';

export const UINT256_MAX = new BigNumber(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
);

export const findNegativeAmountIssue: ValidateFn<BigNumber> = input =>
    input.isNegative() ? 'NEGATIVE_AMOUNT' : null;

export const findNonIntegerIssue: ValidateFn<BigNumber> = input =>
    input.isInteger() ? null : 'NOT_INTEGER';

export const findUint256OverflowIssue: ValidateFn<BigNumber> = input =>
    input.gt(UINT256_MAX) ? 'EXCEEDS_UINT256' : null;

export const findZeroAmountIssue: InspectFn<bigint> = input =>
    input === 0n ? 'ZERO_AMOUNT' : null;

type BalanceContext = ContextWith<{ balance?: bigint }>;

export const findInsufficientBalanceIssue: InspectFn<bigint, BalanceContext> = (input, context) =>
    context?.balance !== undefined && input > context.balance ? 'INSUFFICIENT_BALANCE' : null;

export const validateUint256 = createValidator<BigNumber, bigint, BalanceContext>({
    validate: [findNegativeAmountIssue, findNonIntegerIssue, findUint256OverflowIssue],
    normalize: input => BigInt(input.toFixed(0)),
    inspect: [findZeroAmountIssue, findInsufficientBalanceIssue],
});
