import { BigNumber } from '@trezor/utils';

import { type ValidationResult } from '../../../types/validation';
import { UINT64_MAX } from '../../../validation/shared/uint64';

interface ValidateUint64TestCase {
    description: string;
    input: BigNumber;
    expected: ValidationResult<bigint>;
}

export const validateUint64TestCases: ValidateUint64TestCase[] = [
    {
        description: 'valid amount returns normalized bigint with no issues',
        input: new BigNumber('1'),
        expected: {
            value: 1n,
            issues: [],
        },
    },
    {
        description: 'zero is valid',
        input: new BigNumber('0'),
        expected: {
            value: 0n,
            issues: [],
        },
    },
    {
        description: 'negative amount returns NEGATIVE_AMOUNT issue',
        input: new BigNumber('-1'),
        expected: {
            value: null,
            issues: [{ code: 'NEGATIVE_AMOUNT', path: 'source' }],
        },
    },
    {
        description: 'non-integer amount returns NOT_INTEGER issue',
        input: new BigNumber('1.5'),
        expected: {
            value: null,
            issues: [{ code: 'NOT_INTEGER', path: 'source' }],
        },
    },
    {
        description: 'exact UINT64_MAX is valid',
        input: UINT64_MAX,
        expected: {
            value: BigInt('0xffffffffffffffff'),
            issues: [],
        },
    },
    {
        description: 'amount exceeding uint64 returns EXCEEDS_UINT64 issue',
        input: UINT64_MAX.plus(1),
        expected: {
            value: null,
            issues: [{ code: 'EXCEEDS_UINT64', path: 'source' }],
        },
    },
];
