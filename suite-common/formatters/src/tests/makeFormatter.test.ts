import { makeFormatter } from '../makeFormatter';

const toUpperCase = (string: string) => string.toUpperCase();

const upperCaseFormatter = makeFormatter<string, string>(toUpperCase);

describe('makeFormatter', () => {
    describe('format', () => {
        it('handles trivial formatting', () => {
            expect(upperCaseFormatter.format('foo')).toBe('FOO');
        });

        it('handles trivial formatting', () => {
            expect(upperCaseFormatter.format('foo')).toBe('FOO');
        });
    });
});
