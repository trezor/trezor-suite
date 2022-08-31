import { inHTML, inSingleQuotes, inDoubleQuotes } from '../src/xssFilters';

describe('XSS filters', () => {
    describe('in HTML data', () => {
        it('it should escape < symbol', () => {
            expect(inHTML(`"a"<script>alert(1)</script>'b'`)).toBe(
                `"a"&lt;script>alert(1)&lt;/script>'b'`,
            );
        });
    });

    describe('in single quoted attribute', () => {
        it('it should escape single quote symbol', () => {
            expect(inSingleQuotes(`"a"<script>alert(1)</script>'b'`)).toBe(
                `"a"<script>alert(1)</script>&#39;b&#39;`,
            );
        });
    });

    describe('in double quoted attribute', () => {
        it('it should escape double quote symbol', () => {
            expect(inDoubleQuotes(`"a"<script>alert(1)</script>'b'`)).toBe(
                `&quot;a&quot;<script>alert(1)</script>'b'`,
            );
        });
    });
});
