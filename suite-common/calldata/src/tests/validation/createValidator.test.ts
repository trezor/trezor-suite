import { createValidator } from '../../validation/createValidator';

describe('createValidator', () => {
    describe('validation behavior', () => {
        it('skips validation when validate array is empty', () => {
            const normalize = jest.fn().mockReturnValue('NORMALIZED');

            const validator = createValidator({
                validate: [],
                normalize,
            });

            const result = validator('input', 'field');

            expect(normalize).toHaveBeenCalledWith('input');
            expect(result).toEqual({
                value: 'NORMALIZED',
                issues: [],
            });
        });

        it('calls all validators and normalize when validation passes', () => {
            const validator1 = jest.fn().mockReturnValue(null);
            const validator2 = jest.fn().mockReturnValue(null);
            const normalize = jest.fn().mockReturnValue('NORMALIZED');

            const validator = createValidator({
                validate: [validator1, validator2],
                normalize,
            });

            const result = validator('input', 'field');

            expect(validator1).toHaveBeenCalledWith('input');
            expect(validator2).toHaveBeenCalledWith('input');
            expect(normalize).toHaveBeenCalledWith('input');
            expect(result).toEqual({
                value: 'NORMALIZED',
                issues: [],
            });
        });

        it('stops at first failing validator and does not call normalize', () => {
            const validator1 = jest.fn().mockReturnValue('INVALID_ADDRESS');
            const validator2 = jest.fn().mockReturnValue(null);
            const normalize = jest.fn().mockReturnValue('NORMALIZED');

            const validator = createValidator({
                validate: [validator1, validator2],
                normalize,
            });

            const result = validator('input', 'field');

            expect(validator1).toHaveBeenCalledWith('input');
            expect(validator2).not.toHaveBeenCalled();
            expect(normalize).not.toHaveBeenCalled();
            expect(result).toEqual({
                value: null,
                issues: [{ code: 'INVALID_ADDRESS', path: 'field' }],
            });
        });
    });

    describe('inspect behavior', () => {
        it('returns no issues when inspect returns null', () => {
            const validate = jest.fn().mockReturnValue(null);
            const normalize = jest.fn().mockReturnValue('NORMALIZED');
            const inspect = jest.fn().mockReturnValue(null);

            const validator = createValidator({
                validate: [validate],
                normalize,
                inspect: [inspect],
            });

            const result = validator('input', 'field');

            expect(inspect).toHaveBeenCalledWith('NORMALIZED', undefined);
            expect(result).toEqual({
                value: 'NORMALIZED',
                issues: [],
            });
        });

        it('collects issues from multiple failing inspects', () => {
            const validate = jest.fn().mockReturnValue(null);
            const normalize = jest.fn().mockReturnValue('NORMALIZED');
            const inspect1 = jest.fn().mockReturnValue(null);
            const inspect2 = jest.fn().mockReturnValue('ZERO_ADDRESS');
            const inspect3 = jest.fn().mockReturnValue('SELF_ADDRESS');

            const validator = createValidator({
                validate: [validate],
                normalize,
                inspect: [inspect1, inspect2, inspect3],
            });

            const result = validator('input', 'field');

            expect(inspect1).toHaveBeenCalled();
            expect(inspect2).toHaveBeenCalled();
            expect(inspect3).toHaveBeenCalled();
            expect(result).toEqual({
                value: 'NORMALIZED',
                issues: [
                    { code: 'ZERO_ADDRESS', path: 'field' },
                    { code: 'SELF_ADDRESS', path: 'field' },
                ],
            });
        });

        it('works without inspect defined', () => {
            const validate = jest.fn().mockReturnValue(null);
            const normalize = jest.fn().mockReturnValue('NORMALIZED');

            const validator = createValidator({
                validate: [validate],
                normalize,
            });

            const result = validator('input', 'field');

            expect(result).toEqual({
                value: 'NORMALIZED',
                issues: [],
            });
        });

        it('passes normalized value and context to inspect', () => {
            const validate = jest.fn().mockReturnValue(null);
            const normalize = jest.fn().mockReturnValue('NORMALIZED');
            const inspect = jest.fn().mockReturnValue(null);
            const context = { sender: '0xabc' };

            const validator = createValidator({
                validate: [validate],
                normalize,
                inspect: [inspect],
            });

            validator('input', 'field', context);

            expect(inspect).toHaveBeenCalledWith('NORMALIZED', context);
        });
    });
});
