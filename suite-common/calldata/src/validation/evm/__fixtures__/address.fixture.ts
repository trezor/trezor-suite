import { type EvmAddress, asEvmAddress } from '../../../types/evm';
import { type IssueCode } from '../../../types/validation';

type IsValidAddressTestCase = {
    description: string;
    input: string;
    expected: IssueCode | null;
};

type IsZeroAddressTestCase = {
    description: string;
    input: EvmAddress;
    expected: IssueCode | null;
};

type IsSameAsSenderTestCase = {
    description: string;
    input: EvmAddress;
    context?: { sender?: EvmAddress };
    expected: IssueCode | null;
};

const SENDER = asEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

export const findAddressIssueTestCases: IsValidAddressTestCase[] = [
    {
        description: 'valid lowercase address',
        input: '0x1111111111111111111111111111111111111111',
        expected: null,
    },
    {
        description: 'valid mixed case address',
        input: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        expected: null,
    },
    {
        description: 'too short',
        input: '0x123456789012345678901234567890123456789',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'too long',
        input: '0x12345678901234567890123456789012345678901',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'missing 0x prefix',
        input: '1234567890123456789012345678901234567890',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'invalid hex characters',
        input: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
        expected: 'INVALID_ADDRESS',
    },
    {
        description: 'empty string',
        input: '',
        expected: 'INVALID_ADDRESS',
    },
];

export const findZeroAddressIssueTestCases: IsZeroAddressTestCase[] = [
    {
        description: 'zero address returns ZERO_ADDRESS',
        input: asEvmAddress('0x0000000000000000000000000000000000000000'),
        expected: 'ZERO_ADDRESS',
    },
    {
        description: 'non-zero address returns null',
        input: asEvmAddress('0x1111111111111111111111111111111111111111'),
        expected: null,
    },
];

export const findSelfAddressIssueTestCases: IsSameAsSenderTestCase[] = [
    {
        description: 'same address same case returns SELF_ADDRESS',
        input: asEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        context: { sender: SENDER },
        expected: 'SELF_ADDRESS',
    },
    {
        description: 'same address different case returns SELF_ADDRESS',
        input: asEvmAddress('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
        context: { sender: SENDER },
        expected: 'SELF_ADDRESS',
    },
    {
        description: 'different address returns null',
        input: asEvmAddress('0x1111111111111111111111111111111111111111'),
        context: { sender: SENDER },
        expected: null,
    },
    {
        description: 'no sender in context returns null',
        input: asEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        context: {},
        expected: null,
    },
];

export const findSenderMismatchIssueTestCases: IsSameAsSenderTestCase[] = [
    {
        description: 'different address returns NOT_SAME_AS_SENDER',
        input: asEvmAddress('0x1111111111111111111111111111111111111111'),
        context: { sender: SENDER },
        expected: 'NOT_SAME_AS_SENDER',
    },
    {
        description: 'same address different case returns null',
        input: asEvmAddress('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
        context: { sender: SENDER },
        expected: null,
    },
    {
        description: 'same address returns null',
        input: asEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        context: { sender: SENDER },
        expected: null,
    },
    {
        description: 'no sender in context returns null',
        input: asEvmAddress('0x1111111111111111111111111111111111111111'),
        context: {},
        expected: null,
    },
];

type IsNotWhitelistedTestCase = {
    description: string;
    input: EvmAddress;
    context: { addressWhitelist?: EvmAddress[] };
    expected: IssueCode | null;
};

const WHITELIST: EvmAddress[] = [
    asEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    asEvmAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
];

export const findWhitelistIssueTestCases: IsNotWhitelistedTestCase[] = [
    {
        description: 'address in whitelist returns null',
        input: asEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        context: { addressWhitelist: WHITELIST },
        expected: null,
    },
    {
        description: 'address not in whitelist returns ADDRESS_NOT_WHITELISTED',
        input: asEvmAddress('0x1111111111111111111111111111111111111111'),
        context: { addressWhitelist: WHITELIST },
        expected: 'ADDRESS_NOT_WHITELISTED',
    },
    {
        description: 'address in whitelist different case returns null',
        input: asEvmAddress('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
        context: { addressWhitelist: WHITELIST },
        expected: null,
    },
    {
        description: 'no whitelist in context returns null',
        input: asEvmAddress('0x1111111111111111111111111111111111111111'),
        context: {},
        expected: null,
    },
    {
        description: 'empty whitelist rejects all addresses',
        input: asEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        context: { addressWhitelist: [] },
        expected: 'ADDRESS_NOT_WHITELISTED',
    },
];
