import { BigNumber } from '@trezor/utils';

import { type IssueCode } from '../../../types/validation';
import { UINT256_MAX } from '../../../validation/evm/uint256';

type ValidateFnTestCase = {
    description: string;
    input: BigNumber;
    expected: IssueCode | null;
};

type IsZeroTestCase = {
    description: string;
    input: bigint;
    expected: IssueCode | null;
};

type HasBalanceTestCase = {
    description: string;
    input: bigint;
    context: { balance?: bigint };
    expected: IssueCode | null;
};

export const isNegativeTestCases: ValidateFnTestCase[] = [
    {
        description: 'positive number returns null',
        input: new BigNumber('100'),
        expected: null,
    },
    {
        description: 'zero returns null',
        input: new BigNumber('0'),
        expected: null,
    },
    {
        description: 'negative number returns NEGATIVE_AMOUNT',
        input: new BigNumber('-1'),
        expected: 'NEGATIVE_AMOUNT',
    },
];

export const isNotIntegerTestCases: ValidateFnTestCase[] = [
    {
        description: 'integer returns null',
        input: new BigNumber('100'),
        expected: null,
    },
    {
        description: 'decimal returns NOT_INTEGER',
        input: new BigNumber('1.5'),
        expected: 'NOT_INTEGER',
    },
];

export const exceedsUint256TestCases: ValidateFnTestCase[] = [
    {
        description: 'value within range returns null',
        input: new BigNumber('100'),
        expected: null,
    },
    {
        description: 'value equal to UINT256_MAX returns null',
        input: UINT256_MAX,
        expected: null,
    },
    {
        description: 'value exceeding UINT256_MAX returns EXCEEDS_UINT256',
        input: UINT256_MAX.plus(1),
        expected: 'EXCEEDS_UINT256',
    },
];

export const isZeroTestCases: IsZeroTestCase[] = [
    {
        description: 'zero returns ZERO_AMOUNT',
        input: 0n,
        expected: 'ZERO_AMOUNT',
    },
    {
        description: 'non-zero returns null',
        input: 100n,
        expected: null,
    },
];

export const hasBalanceTestCases: HasBalanceTestCase[] = [
    {
        description: 'balance undefined returns null',
        input: 100n,
        context: {},
        expected: null,
    },
    {
        description: 'input less than balance returns null',
        input: 50n,
        context: { balance: 100n },
        expected: null,
    },
    {
        description: 'input equal to balance returns null',
        input: 100n,
        context: { balance: 100n },
        expected: null,
    },
    {
        description: 'input greater than balance returns INSUFFICIENT_BALANCE',
        input: 101n,
        context: { balance: 100n },
        expected: 'INSUFFICIENT_BALANCE',
    },
    {
        description: 'balance is 0 and input is positive returns INSUFFICIENT_BALANCE',
        input: 1n,
        context: { balance: 0n },
        expected: 'INSUFFICIENT_BALANCE',
    },
];
