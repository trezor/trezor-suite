import { createPolicyTestCases } from './__fixtures__/createPolicy.fixture';
import { createPolicy } from './createPolicy';

describe('createPolicy', () => {
    it.each(createPolicyTestCases)('$description', ({ overrides, issues, expected }) => {
        const policy = createPolicy(overrides);
        expect(policy(issues)).toEqual(expected);
    });
});
