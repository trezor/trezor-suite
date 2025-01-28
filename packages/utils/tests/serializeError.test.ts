import { serializeError } from '../src/serializeError';

class CustomError extends Error {
    somethingExtra = 'extra stuff';

    toString() {
        return `${super.toString()} + ${this.somethingExtra}`;
    }
}

describe(serializeError.name, () => {
    it('serializes an Error instance', () => {
        const error = new Error('example message');
        /*
        A very crude way to mock the stack trace.. But although we can generally mock anything in Jest,
        (in this case that would be Error.prototype.captureStackTrace that sets the Error.stack property)
        specifically errors are not mockable, as Jest relies on them internally and it bugs out Jest.
        But couldn't we then do it at least for CustomError? No, because for Error instances,
        JavaScript bypasses the prototype chain and calls Error.prototype.captureStackTrace directly.
        */
        error.stack = 'Mock Stack Trace';
        expect(JSON.parse(serializeError(error))).toMatchObject({
            message: 'Error: example message',
            stackTrace: 'Mock Stack Trace',
        });

        const customError = new CustomError('example message');
        customError.stack = 'Mock Stack Trace';
        expect(JSON.parse(serializeError(customError))).toMatchObject({
            message: 'Error: example message + extra stuff',
            stackTrace: 'Mock Stack Trace',
        });
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
