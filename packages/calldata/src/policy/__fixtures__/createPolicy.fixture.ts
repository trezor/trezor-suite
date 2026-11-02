import { type PolicyConfig, type PolicyResult } from '../../types/policy';
import { type Issue } from '../../types/validation';

interface CreatePolicyTestCase {
    description: string;
    overrides?: Partial<PolicyConfig>;
    issues: Issue[];
    expected: PolicyResult;
}

export const createPolicyTestCases: CreatePolicyTestCase[] = [
    {
        description: 'default policy with error issue returns isValid false',
        issues: [{ code: 'INVALID_ADDRESS', path: 'to' }],
        expected: {
            issues: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }],
            errors: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }],
            warnings: [],
            isValid: false,
        },
    },
    {
        description: 'default policy with warning issue returns isValid true',
        issues: [{ code: 'ZERO_ADDRESS', path: 'to' }],
        expected: {
            issues: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            errors: [],
            warnings: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            isValid: true,
        },
    },
    {
        description: 'override to ignore excludes issue from result',
        overrides: { ZERO_ADDRESS: 'ignore' },
        issues: [{ code: 'ZERO_ADDRESS', path: 'to' }],
        expected: {
            issues: [],
            errors: [],
            warnings: [],
            isValid: true,
        },
    },
    {
        description: 'override error to warning makes isValid true',
        overrides: { INVALID_ADDRESS: 'warning' },
        issues: [{ code: 'INVALID_ADDRESS', path: 'to' }],
        expected: {
            issues: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'warning' }],
            errors: [],
            warnings: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'warning' }],
            isValid: true,
        },
    },
    {
        description: 'override warning to error makes isValid false',
        overrides: { ZERO_AMOUNT: 'error' },
        issues: [{ code: 'ZERO_AMOUNT', path: 'amount' }],
        expected: {
            issues: [{ code: 'ZERO_AMOUNT', path: 'amount', severity: 'error' }],
            errors: [{ code: 'ZERO_AMOUNT', path: 'amount', severity: 'error' }],
            warnings: [],
            isValid: false,
        },
    },
    {
        description: 'multiple issues are categorized correctly',
        issues: [
            { code: 'INVALID_ADDRESS', path: 'to' },
            { code: 'ZERO_AMOUNT', path: 'amount' },
        ],
        expected: {
            issues: [
                { code: 'INVALID_ADDRESS', path: 'to', severity: 'error' },
                { code: 'ZERO_AMOUNT', path: 'amount', severity: 'warning' },
            ],
            errors: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }],
            warnings: [{ code: 'ZERO_AMOUNT', path: 'amount', severity: 'warning' }],
            isValid: false,
        },
    },
    {
        description: 'empty issues returns empty arrays and isValid true',
        issues: [],
        expected: {
            issues: [],
            errors: [],
            warnings: [],
            isValid: true,
        },
    },
];
