import { RuleTester } from 'eslint';
import path from 'node:path';
import { parser } from 'typescript-eslint';

import { noAnyObjectFromEntriesRule } from './rule';

const typeAwareRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: {
            ecmaVersion: 2020,
            projectService: {
                allowDefaultProject: ['any-object-from-entries.ts'],
            },
            sourceType: 'module',
            tsconfigRootDir: path.join(__dirname, '../..'),
        },
    },
});

const filename = path.join(__dirname, '../..', 'any-object-from-entries.ts');

typeAwareRuleTester.run('no-any-object-from-entries', noAnyObjectFromEntriesRule, {
    valid: [
        {
            name: 'accepts inline entries, which are contextually typed as tuples',
            filename,
            code: `
                type AddressPaths = Record<string, string>;
                declare const addresses: { address: string; path: string }[];
                const paths: AddressPaths = Object.fromEntries(
                    addresses.map(({ address, path }) => [address, path]),
                );
            `,
        },
        {
            name: 'accepts tuple entries stored in a variable',
            filename,
            code: `
                declare const keys: string[];
                const entries = keys.map(key => [key, key.length] as const);
                const counts = Object.fromEntries(entries);
            `,
        },
        {
            name: 'accepts explicitly typed tuple entries',
            filename,
            code: `
                declare const entries: [string, number][];
                const values = Object.fromEntries(entries);
            `,
        },
        {
            name: 'accepts a Map',
            filename,
            code: `
                declare const map: Map<string, number>;
                const values = Object.fromEntries(map);
            `,
        },
        {
            name: 'leaves casts to the no-restricted-syntax selector',
            filename,
            code: `
                declare const entries: string[][];
                const values = Object.fromEntries(entries) as Record<string, string>;
            `,
        },
        {
            name: 'ignores other fromEntries functions',
            filename,
            code: `
                declare const helpers: { fromEntries: (entries: unknown) => any };
                const values = helpers.fromEntries([['a', 1]]);
            `,
        },
    ],
    invalid: [
        {
            name: 'reports array-literal entries stored in a variable',
            filename,
            code: `
                declare const keys: string[];
                const entries = keys.map(key => [key, key]);
                const counts: Record<string, number> = Object.fromEntries(entries);
            `,
            errors: [{ messageId: 'anyResult' }],
        },
        {
            name: 'reports inline entries whose branches return different value types',
            filename,
            code: `
                type Level = { type: 'error' } | { type: 'final'; fee: string };
                declare const levels: Record<string, Level>;
                const reviewed = (): Record<string, Level> =>
                    Object.fromEntries(
                        Object.entries(levels).map(([key, level]) =>
                            level.type === 'error' ? [key, level] : [key, { ...level, extra: true }],
                        ),
                    );
            `,
            errors: [{ messageId: 'anyResult' }],
        },
        {
            name: 'reports nested-array entries returned from a function',
            filename,
            code: `
                declare const getEntries: () => string[][];
                const counts = (): Record<string, number> => Object.fromEntries(getEntries());
            `,
            errors: [{ messageId: 'anyResult' }],
        },
        {
            name: 'reports computed member access',
            filename,
            code: `
                declare const entries: string[][];
                const values = Object['fromEntries'](entries);
            `,
            errors: [{ messageId: 'anyResult' }],
        },
        {
            name: 'reports a satisfies check, which any passes trivially',
            filename,
            code: `
                declare const entries: string[][];
                const values = Object.fromEntries(entries) satisfies Record<string, number>;
            `,
            errors: [{ messageId: 'anyResult' }],
        },
    ],
});
