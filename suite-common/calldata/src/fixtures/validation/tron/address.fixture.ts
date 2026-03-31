import { type TronAddress, asTronAddress } from '../../../types/tron';
import { type IssueCode } from '../../../types/validation';

type IsValidTronAddressTestCase = {
    description: string;
    input: string;
    expected: IssueCode | null;
};

type IsSameAsSenderTestCase = {
    description: string;
    input: TronAddress;
    context?: { sender?: TronAddress };
    expected: IssueCode | null;
};

const ADDRESS = asTronAddress('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4');

export const isValidTronAddressTestCases: IsValidTronAddressTestCase[] = [
    {
        description: 'valid Tron address returns null',
        input: ADDRESS,
        expected: null,
    },
    {
        description: 'too short returns INVALID_ADDRESS',
        input: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'too long returns INVALID_ADDRESS',
        input: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6tt',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'wrong prefix (not T) returns INVALID_ADDRESS',
        input: 'AR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'contains invalid base58 char returns INVALID_ADDRESS',
        input: 'T07NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'corrupted checksum returns INVALID_ADDRESS',
        input: 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz5',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'EVM address returns INVALID_ADDRESS',
        input: '0x1111111111111111111111111111111111111111',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'empty string returns INVALID_ADDRESS',
        input: '',
        expected: 'INVALID_ADDRESS',
    },
];

export const isSameAsSenderTestCases: IsSameAsSenderTestCase[] = [
    {
        description: 'same address returns SELF_ADDRESS',
        input: ADDRESS,
        context: { sender: ADDRESS },
        expected: 'SELF_ADDRESS',
    },
    {
        description: 'different address returns null',
        input: asTronAddress('TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9'),
        context: { sender: ADDRESS },
        expected: null,
    },
    {
        description: 'no sender in context returns null',
        input: ADDRESS,
        context: {},
        expected: null,
    },
];
