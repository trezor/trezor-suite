import { createPolicy } from './createPolicy';
import { createPolicyTestCases } from '../../mocks/policy/mockCreatePolicy';

describe('createPolicy', () => {
    it.each(createPolicyTestCases)('$description', ({ overrides, issues, expected }) => {
        const policy = createPolicy(overrides);
        expect(policy(issues)).toEqual(expected);
    });
});
