import { validateUint256TestCases } from './__fixtures__/mockValidateUint256';
import { validateUint256 } from './uint256';

describe('validateUint256', () => {
    it.each(validateUint256TestCases)('$description', ({ input, context, expected }) => {
        expect(validateUint256(input, 'amount', context)).toEqual(expected);
    });
});
