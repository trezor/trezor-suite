import { BigNumber } from '@trezor/utils';

import { type ValidationResult } from '../../../types/validation';
import { UINT256_MAX } from '../../../validation/evm/uint256';

interface ValidateUint256TestCase {
    description: string;
    input: BigNumber;
    context?: { balance?: bigint };
    expected: ValidationResult<bigint>;
}

export const validateUint256TestCases: ValidateUint256TestCase[] = [
    {
        description: 'valid amount returns normalized bigint with no issues',
        input: new BigNumber('1000000000000000000'),
        expected: {
            value: 1000000000000000000n,
            issues: [],
        },
    },
    {
        description: 'negative amount returns NEGATIVE_AMOUNT issue',
        input: new BigNumber('-1'),
        expected: {
            value: null,
            issues: [{ code: 'NEGATIVE_AMOUNT', path: 'amount' }],
        },
    },
    {
        description: 'non-integer amount returns NOT_INTEGER issue',
        input: new BigNumber('1.5'),
        expected: {
            value: null,
            issues: [{ code: 'NOT_INTEGER', path: 'amount' }],
        },
    },
    {
        description: 'negative decimal returns NEGATIVE_AMOUNT (first validation)',
        input: new BigNumber('-1.5'),
        expected: {
            value: null,
            issues: [{ code: 'NEGATIVE_AMOUNT', path: 'amount' }],
        },
    },
    {
        description: 'exact UINT256_MAX is valid',
        input: UINT256_MAX,
        expected: {
            value: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
            issues: [],
        },
    },
    {
        description: 'amount exceeding uint256 returns EXCEEDS_UINT256 issue',
        input: UINT256_MAX.plus(1),
        expected: {
            value: null,
            issues: [{ code: 'EXCEEDS_UINT256', path: 'amount' }],
        },
    },
    {
        description: 'zero amount returns ZERO_AMOUNT issue',
        input: new BigNumber('0'),
        expected: {
            value: 0n,
            issues: [{ code: 'ZERO_AMOUNT', path: 'amount' }],
        },
    },
    {
        description: 'amount exceeding balance returns INSUFFICIENT_BALANCE issue',
        input: new BigNumber('1000'),
        context: { balance: 500n },
        expected: {
            value: 1000n,
            issues: [{ code: 'INSUFFICIENT_BALANCE', path: 'amount' }],
        },
    },
    {
        description: 'no context provided works without INSUFFICIENT_BALANCE issue',
        input: new BigNumber('1000'),
        expected: {
            value: 1000n,
            issues: [],
        },
    },
];
