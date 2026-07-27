import { BigNumber } from '@trezor/utils';

import { type ValidationResult } from '../../../types/validation';
import { UINT16_MAX } from '../../../validation/shared/uint16';

interface ValidateUint16TestCase {
    description: string;
    input: BigNumber;
    expected: ValidationResult<bigint>;
}

export const validateUint16TestCases: ValidateUint16TestCase[] = [
    {
        description: 'valid amount returns normalized bigint with no issues',
        input: new BigNumber('5'),
        expected: {
            value: 5n,
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
            issues: [{ code: 'NEGATIVE_AMOUNT', path: 'allowedInterchangeNum' }],
        },
    },
    {
        description: 'non-integer amount returns NOT_INTEGER issue',
        input: new BigNumber('1.5'),
        expected: {
            value: null,
            issues: [{ code: 'NOT_INTEGER', path: 'allowedInterchangeNum' }],
        },
    },
    {
        description: 'exact UINT16_MAX is valid',
        input: UINT16_MAX,
        expected: {
            value: BigInt('0xffff'),
            issues: [],
        },
    },
    {
        description: 'amount exceeding uint16 returns EXCEEDS_UINT16 issue',
        input: UINT16_MAX.plus(1),
        expected: {
            value: null,
            issues: [{ code: 'EXCEEDS_UINT16', path: 'allowedInterchangeNum' }],
        },
    },
];
