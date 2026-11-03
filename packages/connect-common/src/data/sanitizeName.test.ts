import { MAX_NAME_LENGTH, sanitizeName } from './sanitizeName';

// A caller picks its own name and Suite shows it on the consent prompt, so these are the rules that
// decide what a user can be made to read there.
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
        ])('drops %s instead of throwing', (_label, input) => {
            expect(sanitizeName(input)).toBeUndefined();
        });
    });

    describe('control characters and lone surrogates', () => {
        it('replaces a control character with a space rather than splicing the name together', () => {
            expect(sanitizeName(`Clau${CODE_POINT.NULL}de Code`)).toBe('Clau de Code');
        });

        it('replaces C0, C1 and DEL controls alike', () => {
            expect(
                sanitizeName(
                    `A${CODE_POINT.UNIT_SEPARATOR}B${CODE_POINT.DELETE}C${CODE_POINT.CSI}D`,
                ),
            ).toBe('A B C D');
        });

        it('collapses a newline and a tab into a single space', () => {
            expect(sanitizeName('Claude\n\tCode')).toBe('Claude Code');
        });

        it('replaces a lone surrogate with a space', () => {
            expect(sanitizeName(`Claude${CODE_POINT.LONE_SURROGATE}Code`)).toBe('Claude Code');
        });

        it('keeps an astral character whose surrogate pair is intact', () => {
            expect(sanitizeName(`Claude ${CODE_POINT.GRINNING_FACE} Code`)).toBe(
                `Claude ${CODE_POINT.GRINNING_FACE} Code`,
            );
        });
    });

    describe('invisible format characters', () => {
        it('replaces a bidi override with a space', () => {
            expect(sanitizeName(`Claude${CODE_POINT.RTL_OVERRIDE} Code`)).toBe('Claude Code');
        });

        it.each([
            ['a zero width space', CODE_POINT.ZERO_WIDTH_SPACE],
            ['a soft hyphen', CODE_POINT.SOFT_HYPHEN],
            ['a byte order mark', CODE_POINT.BYTE_ORDER_MARK],
            ['a word joiner', CODE_POINT.WORD_JOINER],
        ])("does not let %s splice the name into another app's name", (_label, codePoint) => {
            expect(sanitizeName(`Clau${codePoint}de Code`)).toBe('Clau de Code');
        });
    });

    describe('a name that sanitizes to nothing', () => {
        it.each([
            ['an empty string', ''],
            ['whitespace only', '   '],
            ['control characters only', `${CODE_POINT.NULL}${CODE_POINT.UNIT_SEPARATOR}`],
            [
                'zero width spaces only',
                `${CODE_POINT.ZERO_WIDTH_SPACE}${CODE_POINT.ZERO_WIDTH_SPACE}`,
            ],
        ])('drops %s', (_label, input) => {
            expect(sanitizeName(input)).toBeUndefined();
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

    describe("onTooLong: 'reject'", () => {
        it('keeps a name at the limit', () => {
            const name = 'a'.repeat(MAX_NAME_LENGTH);
            expect(sanitizeName(name, { maxLength: MAX_NAME_LENGTH, onTooLong: 'reject' })).toBe(
                name,
            );
        });

        it('drops a name one code point over the limit', () => {
            expect(
                sanitizeName('a'.repeat(MAX_NAME_LENGTH + 1), {
                    maxLength: MAX_NAME_LENGTH,
                    onTooLong: 'reject',
                }),
            ).toBeUndefined();
        });

        it('is the default when no mode is given', () => {
            expect(
                sanitizeName('a'.repeat(MAX_NAME_LENGTH + 1), { maxLength: MAX_NAME_LENGTH }),
            ).toBeUndefined();
        });

        it('measures the limit in code points, not UTF-16 units', () => {
            // 99 characters + one astral one: 100 code points, 101 UTF-16 units.
            const name = `${'a'.repeat(MAX_NAME_LENGTH - 1)}${CODE_POINT.GRINNING_FACE}`;
            expect(name).toHaveLength(MAX_NAME_LENGTH + 1);
            expect(sanitizeName(name, { maxLength: MAX_NAME_LENGTH, onTooLong: 'reject' })).toBe(
                name,
            );
        });
    });

    describe("onTooLong: 'truncate'", () => {
        const truncate = (name: unknown) =>
            sanitizeName(name, { maxLength: MAX_NAME_LENGTH, onTooLong: 'truncate' });

        it('cuts a long name to the limit', () => {
            expect(truncate('a'.repeat(500))).toBe('a'.repeat(MAX_NAME_LENGTH));
        });

        it('leaves a name within the limit untouched', () => {
            expect(truncate('Claude Code')).toBe('Claude Code');
        });

        it('does not end the cut name with the space the cut landed on', () => {
            const name = `${'a'.repeat(MAX_NAME_LENGTH - 1)} bbb`;
            expect(truncate(name)).toBe('a'.repeat(MAX_NAME_LENGTH - 1));
        });

        it('does not cut in the middle of a character', () => {
            // The 100th code point is the astral one; cutting by UTF-16 units would split its pair.
            const name = `${'a'.repeat(MAX_NAME_LENGTH - 1)}${CODE_POINT.GRINNING_FACE}b`;
            expect(truncate(name)).toBe(
                `${'a'.repeat(MAX_NAME_LENGTH - 1)}${CODE_POINT.GRINNING_FACE}`,
            );
        });

        it('drops a name left empty by the cut', () => {
            // Unreachable after the whitespace collapse above, but the guard holds for maxLength 0.
            expect(
                sanitizeName('Claude Code', { maxLength: 0, onTooLong: 'truncate' }),
            ).toBeUndefined();
        });

        it('drops a name that sanitizes to nothing before the cut is reached', () => {
            expect(truncate(CODE_POINT.ZERO_WIDTH_SPACE.repeat(500))).toBeUndefined();
        });
    });

    it('keeps MAX_NAME_LENGTH at 100 for every caller', () => {
        expect(MAX_NAME_LENGTH).toBe(100);
    });
});
