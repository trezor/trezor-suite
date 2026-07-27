import { BigNumber } from '@trezor/utils';

import { type IssueCode } from '../../../types/validation';
import { UINT16_MAX } from '../../../validation/shared/uint16';

type ValidateFnTestCase = {
    description: string;
    input: BigNumber;
    expected: IssueCode | null;
};

export const findUint16OverflowIssueTestCases: ValidateFnTestCase[] = [
    {
        description: 'value within range returns null',
        input: new BigNumber('100'),
        expected: null,
    },
    {
        description: 'value equal to UINT16_MAX returns null',
        input: UINT16_MAX,
        expected: null,
    },
    {
        description: 'value exceeding UINT16_MAX returns EXCEEDS_UINT16',
        input: UINT16_MAX.plus(1),
        expected: 'EXCEEDS_UINT16',
    },
];
