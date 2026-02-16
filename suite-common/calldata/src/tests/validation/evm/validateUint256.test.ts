import { validateUint256TestCases } from '../../../fixtures/validation/evm/validateUint256.fixture';
import { validateUint256 } from '../../../validation/evm/uint256';

describe('validateUint256', () => {
    it.each(validateUint256TestCases)('$description', ({ input, context, expected }) => {
        expect(validateUint256(input, 'amount', context)).toEqual(expected);
    });
});
