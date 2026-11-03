import { MAX_NAME_LENGTH, sanitizeName } from './sanitizeName';

// A caller picks its own name and Suite shows it on the consent prompt, so these are the rules that
// decide what a user can be made to read there. Pinned as they stand today, including the two that
// let a caller present itself under another app's name: a hidden character is removed, which
// splices the name around it back together, and a name of nothing but invisible characters is kept
// even though it renders as no name at all.
describe('sanitizeName', () => {
    const CODE_POINT = {
        NULL: '\u0000',
        UNIT_SEPARATOR: '\u001f',
        DELETE: '\u007f',
        // C1 control, reachable through a UTF-8 payload just like a C0 one.
        CSI: '\u009b',
        SOFT_HYPHEN: '\u00ad',
        ZERO_WIDTH_SPACE: '\u200b',
        BYTE_ORDER_MARK: '\ufeff',
        WORD_JOINER: '\u2060',
        RTL_OVERRIDE: '\u202e',
        LONE_SURROGATE: '\ud800',
        // Astral code point: two UTF-16 units, one character.
        GRINNING_FACE: '\u{1f600}',
    };

    // The parameter is typed `string`, so nothing but the types keeps a caller that does not check
    // its own input from reaching the function with something else.
    const sanitizeUnchecked = (name: unknown) => sanitizeName(name as string);

    it('keeps a plain name as it is', () => {
        expect(sanitizeName('Claude Code')).toBe('Claude Code');
    });

    describe('input that is not a string', () => {
        it.each([
            ['undefined', undefined],
            ['null', null],
            ['a number', 42],
            ['an object', { name: 'Claude Code' }],
            ['an array', ['Claude Code']],
        ])('throws on %s', (_label, input) => {
            expect(() => sanitizeUnchecked(input)).toThrow();
        });
    });

    describe('control characters and lone surrogates', () => {
        it("removes a control character, splicing the name into another app's name", () => {
            expect(sanitizeName(`Clau${CODE_POINT.NULL}de Code`)).toBe('Claude Code');
        });

        it('removes C0 controls and DEL but keeps a C1 control', () => {
            expect(
                sanitizeName(
                    `A${CODE_POINT.UNIT_SEPARATOR}B${CODE_POINT.DELETE}C${CODE_POINT.CSI}D`,
                ),
            ).toBe(`ABC${CODE_POINT.CSI}D`);
        });

        it('removes a newline and a tab instead of collapsing them into a space', () => {
            expect(sanitizeName('Claude\n\tCode')).toBe('ClaudeCode');
        });

        it('keeps a lone surrogate', () => {
            expect(sanitizeName(`Claude${CODE_POINT.LONE_SURROGATE}Code`)).toBe(
                `Claude${CODE_POINT.LONE_SURROGATE}Code`,
            );
        });

        it('keeps an astral character whose surrogate pair is intact', () => {
            expect(sanitizeName(`Claude ${CODE_POINT.GRINNING_FACE} Code`)).toBe(
                `Claude ${CODE_POINT.GRINNING_FACE} Code`,
            );
        });
    });

    describe('invisible format characters', () => {
        it('keeps a bidi override', () => {
            expect(sanitizeName(`Claude${CODE_POINT.RTL_OVERRIDE} Code`)).toBe(
                `Claude${CODE_POINT.RTL_OVERRIDE} Code`,
            );
        });

        it.each([
            ['a zero width space', CODE_POINT.ZERO_WIDTH_SPACE],
            ['a soft hyphen', CODE_POINT.SOFT_HYPHEN],
            ['a word joiner', CODE_POINT.WORD_JOINER],
        ])("keeps %s, which renders as another app's name", (_label, codePoint) => {
            expect(sanitizeName(`Clau${codePoint}de Code`)).toBe(`Clau${codePoint}de Code`);
        });

        // The only one of these the whitespace collapse already catches on its own.
        it('replaces a byte order mark with a space', () => {
            expect(sanitizeName(`Clau${CODE_POINT.BYTE_ORDER_MARK}de Code`)).toBe('Clau de Code');
        });
    });

    describe('a name that sanitizes to nothing', () => {
        it.each([
            ['an empty string', ''],
            ['whitespace only', '   '],
            ['control characters only', `${CODE_POINT.NULL}${CODE_POINT.UNIT_SEPARATOR}`],
        ])('drops %s', (_label, input) => {
            expect(sanitizeName(input)).toBeUndefined();
        });

        it('keeps a name of nothing but zero width spaces, which renders as nothing', () => {
            const invisible = `${CODE_POINT.ZERO_WIDTH_SPACE}${CODE_POINT.ZERO_WIDTH_SPACE}`;
            expect(sanitizeName(invisible)).toBe(invisible);
        });
    });

    it('collapses runs of whitespace and trims the result', () => {
        expect(sanitizeName('  My   App  ')).toBe('My App');
    });

    describe('without a maxLength', () => {
        it('accepts a name of any length', () => {
            const longName = 'a'.repeat(500);
            expect(sanitizeName(longName)).toBe(longName);
        });
    });

    describe('with a maxLength', () => {
        it('keeps a name at the limit', () => {
            const name = 'a'.repeat(MAX_NAME_LENGTH);
            expect(sanitizeName(name, { maxLength: MAX_NAME_LENGTH })).toBe(name);
        });

        it('drops a name one code point over the limit', () => {
            expect(
                sanitizeName('a'.repeat(MAX_NAME_LENGTH + 1), { maxLength: MAX_NAME_LENGTH }),
            ).toBeUndefined();
        });

        it('counts the limit in UTF-16 units, so an astral character costs two', () => {
            // 99 characters + one astral one: 100 code points, 101 UTF-16 units.
            const name = `${'a'.repeat(MAX_NAME_LENGTH - 1)}${CODE_POINT.GRINNING_FACE}`;
            expect(name).toHaveLength(MAX_NAME_LENGTH + 1);
            expect(sanitizeName(name, { maxLength: MAX_NAME_LENGTH })).toBeUndefined();
        });
    });

    it('keeps MAX_NAME_LENGTH at 100 for every caller', () => {
        expect(MAX_NAME_LENGTH).toBe(100);
    });
});
