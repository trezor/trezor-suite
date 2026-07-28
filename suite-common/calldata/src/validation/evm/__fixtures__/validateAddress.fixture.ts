import { type EvmAddress, asEvmAddress } from '../../../types/evm';
import { type ValidationResult } from '../../../types/validation';

interface ValidateAddressTestCase {
    description: string;
    input: string;
    context?: { sender?: EvmAddress; addressWhitelist?: EvmAddress[] };
    expected: ValidationResult<EvmAddress>;
}

const VALID_ADDRESS = asEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
const ZERO_ADDRESS = asEvmAddress('0x0000000000000000000000000000000000000000');

export const validateAddressTestCases: ValidateAddressTestCase[] = [
    {
        description: 'valid address returns normalized value with no issues',
        input: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        expected: {
            value: VALID_ADDRESS,
            issues: [],
        },
    },
    {
        description: 'invalid address returns INVALID_ADDRESS issue',
        input: 'not-an-address',
        expected: {
            value: null,
            issues: [{ code: 'INVALID_ADDRESS', path: 'to' }],
        },
    },
    {
        description: 'uppercase address is normalized to lowercase',
        input: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        expected: {
            value: VALID_ADDRESS,
            issues: [],
        },
    },
    {
        description: 'mixed case address is normalized to lowercase',
        input: '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
        expected: {
            value: VALID_ADDRESS,
            issues: [],
        },
    },
    {
        description: 'zero address as sender returns both ZERO_ADDRESS and SELF_ADDRESS issues',
        input: '0x0000000000000000000000000000000000000000',
        context: { sender: ZERO_ADDRESS },
        expected: {
            value: ZERO_ADDRESS,
            issues: [
                { code: 'ZERO_ADDRESS', path: 'to' },
                { code: 'SELF_ADDRESS', path: 'to' },
            ],
        },
    },
    {
        description: 'address different from sender returns NOT_SAME_AS_SENDER issue',
        input: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        context: { sender: asEvmAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb') },
        expected: {
            value: VALID_ADDRESS,
            issues: [{ code: 'NOT_SAME_AS_SENDER', path: 'to' }],
        },
    },
    {
        description: 'address not in whitelist returns ADDRESS_NOT_WHITELISTED issue',
        input: '0xcccccccccccccccccccccccccccccccccccccccc',
        context: { addressWhitelist: [VALID_ADDRESS] },
        expected: {
            value: asEvmAddress('0xcccccccccccccccccccccccccccccccccccccccc'),
            issues: [{ code: 'ADDRESS_NOT_WHITELISTED', path: 'to' }],
        },
    },
    {
        description: 'address in whitelist returns no whitelist issue',
        input: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        context: { addressWhitelist: [VALID_ADDRESS] },
        expected: {
            value: VALID_ADDRESS,
            issues: [],
        },
    },
];
