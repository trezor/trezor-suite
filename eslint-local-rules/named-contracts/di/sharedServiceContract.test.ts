import path from 'node:path';
import ts from 'typescript';

import { createIsSharedServiceContract } from './sharedServiceContract';

const filename = path.join(__dirname, 'mocks', 'consumer.ts');
const parse = (text: string) => ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);

describe('shared service contract markers without type information', () => {
    it.each([
        ['/** @serviceContract */', true],
        ['/**\n * Shared abstraction.\n * @serviceContract\n */', true],
        ['// @serviceContract', false],
        ['/* @serviceContract */', false],
        ['/** @serviceContractOther */', false],
        ['/** Describes @serviceContract but does not declare the tag. */', false],
    ])('reads the declaration comment %s', (comment, expected) => {
        const isSharedServiceContract = createIsSharedServiceContract(
            parse(`${comment}\n type Service = () => void;`),
        );

        expect(isSharedServiceContract('Service')).toBe(expected);
    });

    it('follows renamed imports and local re-exports', () => {
        const isSharedServiceContract = createIsSharedServiceContract(
            parse(
                "import type { MockReexportedStorage as Service } from './mockServiceContractExports';",
            ),
        );

        expect(isSharedServiceContract('Service')).toBe(true);
    });

    it('finds a marker when the type is exported separately from its declaration', () => {
        const isSharedServiceContract = createIsSharedServiceContract(
            parse("import type { MockLocallyExportedContract } from './mockServiceContracts';"),
        );

        expect(isSharedServiceContract('MockLocallyExportedContract')).toBe(true);
    });

    it('does not reuse markers from a previous lint of the same file', () => {
        const before = createIsSharedServiceContract(
            parse('/** @serviceContract */\ntype Service = () => void;'),
        );
        const after = createIsSharedServiceContract(parse('type Service = () => void;'));

        expect(before('Service')).toBe(true);
        expect(after('Service')).toBe(false);
    });

    it('rejects circular re-exports', () => {
        const { readFile } = ts.sys;
        const exportsFile = path.join(__dirname, 'mocks', 'mockServiceContractExports.ts');
        const readFileSpy = jest
            .spyOn(ts.sys, 'readFile')
            .mockImplementation(file =>
                file === exportsFile
                    ? "export type { MockCycle } from './mockServiceContractExports';"
                    : readFile(file),
            );

        try {
            const isSharedServiceContract = createIsSharedServiceContract(
                parse("import type { MockCycle } from './mockServiceContractExports';"),
            );

            expect(isSharedServiceContract('MockCycle')).toBe(false);
        } finally {
            readFileSpy.mockRestore();
        }
    });
});
