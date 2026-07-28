import { type ValidationResult } from '../../../types/validation';

interface ValidateBytes32TestCase {
    description: string;
    input: string;
    expected: ValidationResult<`0x${string}`>;
}

export const validateBytes32TestCases: ValidateBytes32TestCase[] = [
    {
        description: 'valid hex returns normalized lowercase value with no issues',
        input: '0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
        expected: {
            value: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            issues: [],
        },
    },
    {
        description: 'invalid hex returns null value with INVALID_BYTES32 issue',
        input: '0xabcd',
        expected: {
            value: null,
            issues: [{ code: 'INVALID_BYTES32', path: 'proof' }],
        },
    },
];
