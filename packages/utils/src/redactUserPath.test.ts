import { redactUserPathFromString } from './redactUserPath';

describe('redactUserPathFromString', () => {
    it('redacts username from unix path', () => {
        expect(redactUserPathFromString('/Users/satoshi/Library/file.txt')).toBe(
            '/Users/[*]/Library/file.txt',
        );
    });

    it('redacts username from windows path', () => {
        expect(redactUserPathFromString('C:\\Users\\satoshi\\AppData\\file.txt')).toBe(
            'C:\\Users\\[*]\\AppData\\file.txt',
        );
    });

    it('redacts username from windows path with escaped backslashes', () => {
        expect(redactUserPathFromString('C:\\\\Users\\\\satoshi\\\\AppData')).toBe(
            'C:\\\\Users\\\\[*]\\\\AppData',
        );
    });

    it('redacts username from lowercase users directory', () => {
        expect(redactUserPathFromString('/users/satoshi/file.txt')).toBe('/users/[*]/file.txt');
    });

    it('redacts username containing a space', () => {
        expect(redactUserPathFromString('/Users/Satoshi Nakamoto/file.txt')).toBe(
            '/Users/[*]/file.txt',
        );
    });

    it('stops redacting at quotes and brackets', () => {
        expect(redactUserPathFromString('{"path":"/Users/satoshi","other":"value"}')).toBe(
            '{"path":"/Users/[*]","other":"value"}',
        );
        expect(redactUserPathFromString("['/Users/satoshi']")).toBe("['/Users/[*]']");
    });

    it('redacts all occurrences', () => {
        expect(redactUserPathFromString('/Users/alice/a and /Users/bob/b')).toBe(
            '/Users/[*]/a and /Users/[*]/b',
        );
    });

    it('leaves text without user path unchanged', () => {
        expect(redactUserPathFromString('/home/satoshi/file.txt')).toBe('/home/satoshi/file.txt');
        expect(redactUserPathFromString('no path here')).toBe('no path here');
    });
});
