import { RuleTester } from 'eslint';
import path from 'node:path';
import { parser } from 'typescript-eslint';

export const namedContractsRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: {
            ecmaVersion: 2020,
            projectService: {
                allowDefaultProject: ['named-contracts.ts'],
            },
            sourceType: 'module',
            tsconfigRootDir: path.join(__dirname, '../..'),
        },
    },
});

export const namedContractsFilename = path.join(__dirname, '../..', 'named-contracts.ts');
