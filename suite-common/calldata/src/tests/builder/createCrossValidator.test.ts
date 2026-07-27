import { createCrossValidator } from '../../builder/createCrossValidator';
import { createPolicy } from '../../policy/createPolicy';

describe('createCrossValidator', () => {
    it('returns empty array when validate returns null', () => {
        const validator = createCrossValidator({ validate: () => null });

        expect(validator({})).toEqual([]);
    });

    it('returns issue with default severity when validate returns a code', () => {
        const validator = createCrossValidator({
            validate: () => 'ARRAYS_LENGTH_MISMATCH',
        });

        expect(validator({})).toEqual([
            { code: 'ARRAYS_LENGTH_MISMATCH', path: null, severity: 'error' },
        ]);
    });

    it('applies custom policy when provided', () => {
        const validator = createCrossValidator({
            validate: () => 'ARRAYS_LENGTH_MISMATCH',
            policy: createPolicy({ ARRAYS_LENGTH_MISMATCH: 'warning' }),
        });

        expect(validator({})).toEqual([
            { code: 'ARRAYS_LENGTH_MISMATCH', path: null, severity: 'warning' },
        ]);
    });
});
