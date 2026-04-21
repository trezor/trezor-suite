import { createArrayValidator } from '../../validation/createArrayValidator';

describe('createArrayValidator', () => {
    it('returns null and collects all issues when elements are invalid', () => {
        const elementValidator = jest
            .fn()
            .mockImplementation((input, path) =>
                input === 'bad'
                    ? { value: null, issues: [{ code: 'INVALID_ADDRESS', path }] }
                    : { value: input, issues: [] },
            );

        const arrayValidator = createArrayValidator(elementValidator);

        expect(arrayValidator(['ok', 'bad', 'ok'], 'field')).toEqual({
            value: null,
            issues: [{ code: 'INVALID_ADDRESS', path: 'field[1]' }],
        });

        expect(arrayValidator(['bad', 'bad', 'ok'], 'field')).toEqual({
            value: null,
            issues: [
                { code: 'INVALID_ADDRESS', path: 'field[0]' },
                { code: 'INVALID_ADDRESS', path: 'field[1]' },
            ],
        });
    });

    it('returns empty array and no issues for empty input', () => {
        const elementValidator = jest.fn();
        const arrayValidator = createArrayValidator(elementValidator);
        const result = arrayValidator([], 'field');

        expect(result).toEqual({ value: [], issues: [] });
        expect(elementValidator).not.toHaveBeenCalled();
    });

    it('passes indexed path and context to each element validator', () => {
        const elementValidator = jest.fn().mockImplementation((input, _path) => ({
            value: input,
            issues: [],
        }));

        const context = { sender: '0xabc' };
        const arrayValidator = createArrayValidator(elementValidator);
        arrayValidator(['x', 'y', 'z'], 'items', context);

        expect(elementValidator).toHaveBeenNthCalledWith(1, 'x', 'items[0]', context);
        expect(elementValidator).toHaveBeenNthCalledWith(2, 'y', 'items[1]', context);
        expect(elementValidator).toHaveBeenNthCalledWith(3, 'z', 'items[2]', context);
    });

    it('supports nested arrays by composing twice', () => {
        const elementValidator = jest
            .fn()
            .mockImplementation((input, path) =>
                input === 'bad'
                    ? { value: null, issues: [{ code: 'INVALID_BYTES32', path }] }
                    : { value: input.toUpperCase(), issues: [] },
            );

        const nestedArrayValidator = createArrayValidator(createArrayValidator(elementValidator));
        const validResult = nestedArrayValidator([['a', 'b'], ['c']], 'proofs');

        expect(validResult).toEqual({ value: [['A', 'B'], ['C']], issues: [] });
        expect(elementValidator).toHaveBeenNthCalledWith(1, 'a', 'proofs[0][0]', undefined);
        expect(elementValidator).toHaveBeenNthCalledWith(2, 'b', 'proofs[0][1]', undefined);
        expect(elementValidator).toHaveBeenNthCalledWith(3, 'c', 'proofs[1][0]', undefined);

        const invalidResult = nestedArrayValidator([['ok', 'bad'], ['ok']], 'proofs');

        expect(invalidResult).toEqual({
            value: null,
            issues: [{ code: 'INVALID_BYTES32', path: 'proofs[0][1]' }],
        });
    });
});
