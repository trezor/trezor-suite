import * as validation from './validation';

describe('Validation', () => {
    it('isPrimitive', () => {
        expect(validation.isPrimitive('string', 'foo')).toBe(true);
        expect(validation.isPrimitive(['string', true], undefined)).toBe(true);

        expect(validation.isPrimitive('string', 1)).toBe(false);
        expect(validation.isPrimitive(['string', true], 1)).toBe(false);
    });

    it('isObject', () => {
        expect(validation.isObject({ foo: 'string' }, { foo: 'value' })).toBe(true);
        // optional
        expect(validation.isObject({ foo: ['string', true] }, {})).toBe(true);

        expect(validation.isObject({ foo: 'string' }, {})).toBe(false);
        expect(validation.isObject({ foo: 'string' }, null)).toBe(false);
    });

    it('isStringArray', () => {
        expect(validation.isStringArray([])).toBe(true);
        expect(validation.isStringArray(['a', 'b'])).toBe(true);

        expect(validation.isStringArray('a')).toBe(false);
        expect(validation.isStringArray(['a', 1])).toBe(false);
        expect(validation.isStringArray(null)).toBe(false);
    });

    it('isValidChannel', () => {
        expect(validation.isValidChannel('foo')).toBe(false);
        expect(validation.isValidChannel('handshake/event')).toBe(true);
    });
});
