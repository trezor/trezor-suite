import { BigNumber } from '@trezor/utils';

import { type ValidateFn, createValidator } from '../createValidator';
import { findNegativeAmountIssue, findNonIntegerIssue } from './uint256';

export const UINT16_MAX = new BigNumber('0xffff');

export const findUint16OverflowIssue: ValidateFn<BigNumber> = input =>
    input.gt(UINT16_MAX) ? 'EXCEEDS_UINT16' : null;

export const validateUint16 = createValidator<BigNumber, bigint>({
    validate: [findNegativeAmountIssue, findNonIntegerIssue, findUint16OverflowIssue],
    normalize: input => BigInt(input.toFixed(0)),
});
