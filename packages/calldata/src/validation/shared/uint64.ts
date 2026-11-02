import { BigNumber } from '@trezor/utils';

import { type ValidateFn, createValidator } from '../createValidator';
import { findNegativeAmountIssue, findNonIntegerIssue } from './uint256';

export const UINT64_MAX = new BigNumber('0xffffffffffffffff');

export const findUint64OverflowIssue: ValidateFn<BigNumber> = input =>
    input.gt(UINT64_MAX) ? 'EXCEEDS_UINT64' : null;

export const validateUint64 = createValidator<BigNumber, bigint>({
    validate: [findNegativeAmountIssue, findNonIntegerIssue, findUint64OverflowIssue],
    normalize: input => BigInt(input.toFixed(0)),
});
