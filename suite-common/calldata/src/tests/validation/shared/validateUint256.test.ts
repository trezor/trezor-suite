import { validateUint256TestCases } from '../../../fixtures/validation/shared/validateUint256.fixture';
import { validateUint256 } from '../../../validation/shared/uint256';

describe('validateUint256', () => {
    it.each(validateUint256TestCases)('$description', ({ input, context, expected }) => {
        expect(validateUint256(input, 'amount', context)).toEqual(expected);
    });
});
