import { createPolicyTestCases } from '../../fixtures/policy/createPolicy.fixture';
import { createPolicy } from '../../policy/createPolicy';

describe('createPolicy', () => {
    it.each(createPolicyTestCases)('$description', ({ overrides, issues, expected }) => {
        const policy = createPolicy(overrides);
        expect(policy(issues)).toEqual(expected);
    });
});
