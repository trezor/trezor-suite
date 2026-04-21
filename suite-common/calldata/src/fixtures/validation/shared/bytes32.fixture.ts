import { type IssueCode } from '../../../types/validation';

type TestCase = {
    description: string;
    input: string;
    expected: IssueCode | null;
};

const VALID = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

export const isValidBytes32TestCases: TestCase[] = [
    { description: 'valid lowercase hex returns null', input: VALID, expected: null },
    {
        description: 'valid uppercase hex returns null',
        input: '0x' + VALID.slice(2).toUpperCase(),
        expected: null,
    },
    { description: 'empty string returns INVALID_BYTES32', input: '', expected: 'INVALID_BYTES32' },
    {
        description: 'missing 0x prefix returns INVALID_BYTES32',
        input: VALID.slice(2),
        expected: 'INVALID_BYTES32',
    },
    {
        description: 'too short returns INVALID_BYTES32',
        input: '0xabcd',
        expected: 'INVALID_BYTES32',
    },
    {
        description: 'too long returns INVALID_BYTES32',
        input: VALID + 'ab',
        expected: 'INVALID_BYTES32',
    },
    {
        description: 'invalid hex characters return INVALID_BYTES32',
        input: '0xGGGGGG1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        expected: 'INVALID_BYTES32',
    },
];
