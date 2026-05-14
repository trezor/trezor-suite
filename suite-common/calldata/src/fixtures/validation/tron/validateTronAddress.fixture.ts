import { type TronAddress, asTronAddress } from '../../../types/tron';
import { type ValidationResult } from '../../../types/validation';

interface ValidateTronAddressTestCase {
    description: string;
    input: string;
    context?: { sender?: TronAddress };
    expected: ValidationResult<TronAddress>;
}

const VALID_ADDRESS = asTronAddress('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4');

export const validateTronAddressTestCases: ValidateTronAddressTestCase[] = [
    {
        description: 'valid address returns normalized value with no issues',
        input: VALID_ADDRESS,
        expected: {
            value: VALID_ADDRESS,
            issues: [],
        },
    },
    {
        description: 'invalid address returns INVALID_ADDRESS issue',
        input: 'not-a-tron-address',
        expected: {
            value: null,
            issues: [{ code: 'INVALID_ADDRESS', path: 'to' }],
        },
    },
    {
        description: 'self-transfer returns SELF_ADDRESS issue',
        input: VALID_ADDRESS,
        context: { sender: VALID_ADDRESS },
        expected: {
            value: VALID_ADDRESS,
            issues: [{ code: 'SELF_ADDRESS', path: 'to' }],
        },
    },
];
