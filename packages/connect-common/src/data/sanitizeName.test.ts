import { MAX_NAME_LENGTH, sanitizeName } from './sanitizeName';

describe('sanitizeName', () => {
    const CODE_POINT = {
        NULL: '\u0000',
        UNIT_SEPARATOR: '\u001f',
        DELETE: '\u007f',
        CSI: '\u009b',
        SOFT_HYPHEN: '\u00ad',
        ZERO_WIDTH_SPACE: '\u200b',
        BYTE_ORDER_MARK: '\ufeff',
        WORD_JOINER: '\u2060',
        RTL_OVERRIDE: '\u202e',
        HANGUL_CHOSEONG_FILLER: '\u115f',
        HANGUL_JUNGSEONG_FILLER: '\u1160',
        BLANK_BRAILLE_PATTERN: '\u2800',
        HANGUL_FILLER: '\u3164',
        HALFWIDTH_HANGUL_FILLER: '\uffa0',
        VARIATION_SELECTOR_16: '\ufe0f',
        COMBINING_ACUTE: '\u0301',
        LONE_SURROGATE: '\ud800',
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
        it('replaces a control character with a space, which keeps words apart', () => {
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
        it('removes a bidi override, which would reorder the text around the name', () => {
            expect(sanitizeName(`Claude${CODE_POINT.RTL_OVERRIDE} Code`)).toBe('Claude Code');
        });

        it.each([
            ['a zero width space', CODE_POINT.ZERO_WIDTH_SPACE],
            ['a soft hyphen', CODE_POINT.SOFT_HYPHEN],
            ['a byte order mark', CODE_POINT.BYTE_ORDER_MARK],
            ['a word joiner', CODE_POINT.WORD_JOINER],
        ])('removes %s', (_label, codePoint) => {
            expect(sanitizeName(`Clau${codePoint}de Code`)).toBe('Claude Code');
        });

        it('keeps a zero width non-joiner, which a Persian word needs', () => {
            const persianWord = '\u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u0645';
            expect(sanitizeName(persianWord)).toBe(persianWord);
        });

        it('keeps a zero width joiner, which an emoji sequence needs', () => {
            const couple = '\u{1f468}\u200d\u{1f469}';
            expect(sanitizeName(couple)).toBe(couple);
        });
    });

    describe('characters that render blank', () => {
        const BLANK_CHARACTERS = [
            ['a Hangul choseong filler', CODE_POINT.HANGUL_CHOSEONG_FILLER],
            ['a Hangul jungseong filler', CODE_POINT.HANGUL_JUNGSEONG_FILLER],
            ['a blank Braille pattern', CODE_POINT.BLANK_BRAILLE_PATTERN],
            ['a Hangul filler', CODE_POINT.HANGUL_FILLER],
            ['a halfwidth Hangul filler', CODE_POINT.HALFWIDTH_HANGUL_FILLER],
            ['a combining grapheme joiner', '\u034f'],
            ['a Khmer inherent vowel', '\u17b4'],
            ['a Mongolian variation selector', '\u180b'],
            ['a default-ignorable unassigned code point', '\u2065'],
            ['a variation selector from the supplement', '\u{e0100}'],
        ];

        it.each(BLANK_CHARACTERS)('drops a name made only of %s', (_label, codePoint) => {
            expect(sanitizeName(codePoint.repeat(2))).toBeUndefined();
        });

        it.each(BLANK_CHARACTERS)('removes %s inside a name', (_label, codePoint) => {
            expect(sanitizeName(`Clau${codePoint}de Code`)).toBe('Claude Code');
        });

        it('keeps a variation selector, which an emoji needs', () => {
            const redHeart = `\u2764${CODE_POINT.VARIATION_SELECTOR_16}`;
            expect(sanitizeName(`Claude ${redHeart}`)).toBe(`Claude ${redHeart}`);
        });

        it.each([
            ['joiners', '\u200c\u200d'],
            ['variation selectors', '\ufe0e\ufe0f'],
        ])('drops a name made only of the %s it otherwise keeps', (_label, input) => {
            expect(sanitizeName(input)).toBeUndefined();
        });
    });

    describe('combining marks', () => {
        it.each([
            ['Vietnamese', 'Vie\u0323\u0302t'],
            ['Hebrew with vowel points', '\u05e9\u05c1\u05b8\u05dc\u05d5\u05b9\u05dd'],
        ])('keeps the marks %s needs', (_label, name) => {
            expect(sanitizeName(name)).toBe(name);
        });

        it('caps a stack of marks, which would paint over the text around the name', () => {
            expect(sanitizeName(`Clau${CODE_POINT.COMBINING_ACUTE.repeat(20)}de`)).toBe(
                `Clau${CODE_POINT.COMBINING_ACUTE.repeat(4)}de`,
            );
        });

        it('drops a name made only of marks, which have nothing to sit on', () => {
            expect(sanitizeName(CODE_POINT.COMBINING_ACUTE.repeat(2))).toBeUndefined();
        });
    });

    // The same name is sanitized at more than one layer, so a second pass must not change it.
    it.each([
        ['an emoji with its selector', 'a \u2764\ufe0f b'],
        ['a stack of marks', `a${'\u0301'.repeat(20)}`],
        ['marks split by an invisible character', 'a\u0301\u0301\u0301\u200b\u0301\u0301'],
        ['an over-long name cut after an emoji', `${'a'.repeat(99)}\u2764\ufe0fb`],
    ])('leaves %s unchanged on a second pass', (_label, name) => {
        const sanitized = sanitizeName(name);

        expect(sanitized).toBeDefined();
        expect(sanitizeName(sanitized)).toBe(sanitized);
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

    it.each([
        ['leading', '  My App', 'My App'],
        ['trailing', 'My App  ', 'My App'],
        ['inner', 'My   App', 'My App'],
        ['leading, trailing and inner', '  My   App  ', 'My App'],
    ])('collapses %s whitespace', (_label, input, expected) => {
        expect(sanitizeName(input)).toBe(expected);
    });

    describe('a name over MAX_NAME_LENGTH', () => {
        it('keeps a name at the limit', () => {
            const name = 'a'.repeat(MAX_NAME_LENGTH);
            expect(sanitizeName(name)).toBe(name);
        });

        it('cuts a long name to the limit', () => {
            expect(sanitizeName('a'.repeat(500))).toBe('a'.repeat(MAX_NAME_LENGTH));
        });

        it('does not end the cut name with the space the cut landed on', () => {
            const name = `${'a'.repeat(MAX_NAME_LENGTH - 1)} bbb`;
            expect(sanitizeName(name)).toBe('a'.repeat(MAX_NAME_LENGTH - 1));
        });

        it('does not cut in the middle of a character', () => {
            // The 100th code point is the astral one; cutting by UTF-16 units would split its pair.
            const name = `${'a'.repeat(MAX_NAME_LENGTH - 1)}${CODE_POINT.GRINNING_FACE}b`;
            expect(sanitizeName(name)).toBe(
                `${'a'.repeat(MAX_NAME_LENGTH - 1)}${CODE_POINT.GRINNING_FACE}`,
            );
        });

        it('drops a name the cut leaves with nothing visible', () => {
            expect(
                sanitizeName(`${`${CODE_POINT.COMBINING_ACUTE} `.repeat(200)}a`),
            ).toBeUndefined();
        });

        it('drops a name that sanitizes to nothing before the cut is reached', () => {
            expect(sanitizeName(CODE_POINT.ZERO_WIDTH_SPACE.repeat(500))).toBeUndefined();
        });
    });

    it('keeps MAX_NAME_LENGTH at 100 for every caller', () => {
        expect(MAX_NAME_LENGTH).toBe(100);
    });
});
