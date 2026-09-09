import path from 'node:path';
import ts from 'typescript';

import { createHasSymbolTag } from './hasSymbolTag';

const filename = path.join(__dirname, 'mocks', 'consumer.ts');
const parse = (text: string) => ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);

describe('symbol JSDoc tags without type information', () => {
    it.each([
        'function Symbol() {}',
        'const Symbol = () => {};',
        'let Symbol = 1;',
        'var Symbol = 1;',
        'class Symbol {}',
        'interface Symbol {}',
        'type Symbol = string;',
        'enum Symbol { Value }',
    ])('reads a custom tag on %s', declaration => {
        const hasSymbolTag = createHasSymbolTag(parse(`/** @custom.tag */\n${declaration}`));

        expect(hasSymbolTag('Symbol', 'custom.tag')).toBe(true);
        expect(hasSymbolTag('Symbol', 'serviceContract')).toBe(false);
        expect(hasSymbolTag('Symbol', 'customXtag')).toBe(false);
    });

    it('reads multiple tags from the same declaration', () => {
        const hasSymbolTag = createHasSymbolTag(
            parse(`
            /**
             * @internal
             * @deprecated Use the replacement.
             */
            const symbol = 1;
        `),
        );

        expect(hasSymbolTag('symbol', 'internal')).toBe(true);
        expect(hasSymbolTag('symbol', 'deprecated')).toBe(true);
        expect(hasSymbolTag('symbol', 'deprecate')).toBe(false);
    });

    it('uses the statement comment for each named variable', () => {
        const hasSymbolTag = createHasSymbolTag(
            parse('/** @internal */\nconst first = 1, second = 2;'),
        );

        expect(hasSymbolTag('first', 'internal')).toBe(true);
        expect(hasSymbolTag('second', 'internal')).toBe(true);
    });

    it('does not search inside class members or nested scopes', () => {
        const hasSymbolTag = createHasSymbolTag(
            parse(`
            class Container {
                /** @internal */
                member = 1;
            }
            function outer() {
                /** @internal */
                const inner = 1;
            }
        `),
        );

        expect(hasSymbolTag('Container', 'internal')).toBe(false);
        expect(hasSymbolTag('member', 'internal')).toBe(false);
        expect(hasSymbolTag('inner', 'internal')).toBe(false);
    });

    it.each([
        ['mockLegacyFunction', 'deprecated'],
        ['mockTaggedValue', 'internal'],
        ['MockTaggedClass', 'internal'],
    ])('follows named value exports for %s', (name, tag) => {
        const hasSymbolTag = createHasSymbolTag(
            parse(`import { ${name} as symbol } from './mockSymbolTagExports';`),
        );

        expect(hasSymbolTag('symbol', tag)).toBe(true);
        expect(hasSymbolTag('symbol', 'otherTag')).toBe(false);
    });

    it.each([
        ['/** @serviceContract */', true],
        ['/**\n * Shared abstraction.\n * @serviceContract\n */', true],
        ['// @serviceContract', false],
        ['/* @serviceContract */', false],
        ['/** @serviceContractOther */', false],
        ['/** Describes @serviceContract but does not declare the tag. */', false],
    ])('reads the declaration comment %s', (comment, expected) => {
        const hasSymbolTag = createHasSymbolTag(parse(`${comment}\n type Service = () => void;`));

        expect(hasSymbolTag('Service', 'serviceContract')).toBe(expected);
    });

    it('follows renamed imports and local re-exports', () => {
        const hasSymbolTag = createHasSymbolTag(
            parse(
                "import type { MockReexportedStorage as Service } from './mockSymbolTagExports';",
            ),
        );

        expect(hasSymbolTag('Service', 'serviceContract')).toBe(true);
    });

    it('finds a marker when the type is exported separately from its declaration', () => {
        const hasSymbolTag = createHasSymbolTag(
            parse("import type { MockLocallyExportedContract } from './mockSymbolTags';"),
        );

        expect(hasSymbolTag('MockLocallyExportedContract', 'serviceContract')).toBe(true);
    });

    it('does not reuse markers from a previous lint of the same file', () => {
        const before = createHasSymbolTag(
            parse('/** @serviceContract */\ntype Service = () => void;'),
        );
        const after = createHasSymbolTag(parse('type Service = () => void;'));

        expect(before('Service', 'serviceContract')).toBe(true);
        expect(after('Service', 'serviceContract')).toBe(false);
    });

    it('rejects circular re-exports', () => {
        const { readFile } = ts.sys;
        const exportsFile = path.join(__dirname, 'mocks', 'mockSymbolTagExports.ts');
        const readFileSpy = jest
            .spyOn(ts.sys, 'readFile')
            .mockImplementation(file =>
                file === exportsFile
                    ? "export type { MockCycle } from './mockSymbolTagExports';"
                    : readFile(file),
            );

        try {
            const hasSymbolTag = createHasSymbolTag(
                parse("import type { MockCycle } from './mockSymbolTagExports';"),
            );

            expect(hasSymbolTag('MockCycle', 'serviceContract')).toBe(false);
        } finally {
            readFileSpy.mockRestore();
        }
    });
});
