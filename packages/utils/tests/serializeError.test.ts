import { serializeError } from '../src/serializeError';

class CustomError extends Error {
    somethingExtra = 'extra stuff';

    toString() {
        return `${super.toString()} + ${this.somethingExtra} `;
    }
}

describe(serializeError.name, () => {
    it('serializes an Error instance', () => {
        const error = new Error('example message');
        expect(serializeError(error)).toBe('Error: example message');

        const customError = new CustomError('example message');
        expect(serializeError(customError)).toBe('Error: example message + extra stuff ');
    });

    it('serializes a plain object', () => {
        const error = { message: 'test' };
        expect(serializeError(error)).toBe(JSON.stringify(error));
    });

    it('serializes a primitive', () => {
        expect(serializeError('test')).toBe('test');
        expect(serializeError(123)).toBe('123');
        expect(serializeError(false)).toBe('false');
    });
});
