import { validateBytes32TestCases } from './__fixtures__/validateBytes32.fixture';
import { validateBytes32 } from './bytes32';

describe('validateBytes32', () => {
    it.each(validateBytes32TestCases)('$description', ({ input, expected }) => {
        expect(validateBytes32(input, 'proof')).toEqual(expected);
    });
});
