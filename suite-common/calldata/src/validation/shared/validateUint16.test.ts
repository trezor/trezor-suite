import { validateUint16TestCases } from './__fixtures__/validateUint16.fixture';
import { validateUint16 } from './uint16';

describe('validateUint16', () => {
    it.each(validateUint16TestCases)('$description', ({ input, expected }) => {
        expect(validateUint16(input, 'allowedInterchangeNum')).toEqual(expected);
    });
});
