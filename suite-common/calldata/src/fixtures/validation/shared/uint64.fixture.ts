import { BigNumber } from '@trezor/utils';

import { type IssueCode } from '../../../types/validation';
import { UINT64_MAX } from '../../../validation/shared/uint64';

type ValidateFnTestCase = {
    description: string;
    input: BigNumber;
    expected: IssueCode | null;
};

export const findUint64OverflowIssueTestCases: ValidateFnTestCase[] = [
    {
        description: 'value within range returns null',
        input: new BigNumber('100'),
        expected: null,
    },
    {
        description: 'zero returns null (lower boundary, no overflow)',
        input: new BigNumber(0),
        expected: null,
    },
    {
        description: 'negative value returns null (negativity is checked elsewhere)',
        input: new BigNumber(-1),
        expected: null,
    },
    {
        description: 'value equal to UINT64_MAX returns null',
        input: UINT64_MAX,
        expected: null,
    },
    {
        description: 'value exceeding UINT64_MAX returns EXCEEDS_UINT64',
        input: UINT64_MAX.plus(1),
        expected: 'EXCEEDS_UINT64',
    },
];
