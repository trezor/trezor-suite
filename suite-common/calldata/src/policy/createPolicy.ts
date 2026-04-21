import { type IssueWithSeverity, type PolicyConfig, type PolicyResult } from '../types/policy';
import { type Issue } from '../types/validation';

const DEFAULT_POLICY: PolicyConfig = {
    // Address
    INVALID_ADDRESS: 'error',
    ZERO_ADDRESS: 'warning',
    SELF_ADDRESS: 'ignore',
    NOT_SAME_AS_SENDER: 'ignore',
    ADDRESS_NOT_WHITELISTED: 'error',

    // Amount
    NEGATIVE_AMOUNT: 'error',
    NOT_INTEGER: 'error',
    EXCEEDS_UINT256: 'error',
    ZERO_AMOUNT: 'warning',
    INSUFFICIENT_BALANCE: 'warning',

    // Bytes
    INVALID_BYTES32: 'error',

    // Cross-param
    ARRAYS_LENGTH_MISMATCH: 'error',

    // Encoding
    ENCODING_FAILED: 'error',
};

export const createPolicy = (overrides?: Partial<PolicyConfig>) => {
    const config: PolicyConfig = { ...DEFAULT_POLICY, ...overrides };

    return (issues: Issue[]): PolicyResult => {
        const categorized = issues.map<IssueWithSeverity>(issue => ({
            ...issue,
            severity: config[issue.code],
        }));

        const errors = categorized.filter(issue => issue.severity === 'error');
        const warnings = categorized.filter(issue => issue.severity === 'warning');

        return {
            issues: categorized.filter(issue => issue.severity !== 'ignore'),
            errors,
            warnings,
            isValid: errors.length === 0,
        };
    };
};
