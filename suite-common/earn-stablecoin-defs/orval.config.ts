import { ClientGeneratorsBuilder, defineConfig } from 'orval';
import { resolve } from 'path';

import { EarnYieldWorkerBaseUrl } from './src';

const ESLINT_DISABLE_HEADER = '/* eslint-disable no-useless-escape */';

const camelCase = (value: string) => value.replace(/^[A-Z]/, char => char.toLowerCase());

function renameAllExportsToCamelCase(implementation: string): string {
    const pascalCaseNames: string[] = [];
    const re = /export const ([A-Z][a-zA-Z0-9_]*) =/g;
    let match;
    while ((match = re.exec(implementation)) !== null) {
        // @ts-expect-error: noUncheckedIndexedAccess
        const secondMatch: string = match[1];
        pascalCaseNames.push(secondMatch);
    }

    let result = implementation;

    for (const name of pascalCaseNames) {
        result = result.replace(new RegExp(`\\b${name}\\b`, 'g'), camelCase(name));
    }

    return result;
}

const API_DIR = resolve(import.meta.dirname, './src/api');
const YIELD_BASE_URL: EarnYieldWorkerBaseUrl = 'https://dev-earn.suite.sldev.cz/yield';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    earnYield: {
        input: {
            target: `${YIELD_BASE_URL}/openapi`,
        },
        output: {
            mode: 'single',
            mock: false,
            target: resolve(API_DIR, 'schemas', 'index.ts'),
            clean: true,
            tsconfig: './tsconfig.json',
            packageJson: './package.json',
            indexFiles: true,
            fileExtension: '.ts',
            client: clients => {
                const zodClient = clients.zod;

                return {
                    ...zodClient,
                    client: async (verbOptions, options, output) => {
                        const result = await zodClient.client(verbOptions, options, output);

                        return {
                            ...result,
                            implementation: `${ESLINT_DISABLE_HEADER}\n${renameAllExportsToCamelCase(result.implementation)}`,
                        };
                    },
                } satisfies ClientGeneratorsBuilder;
            },
            schemas: {
                type: 'typescript',
                path: resolve(API_DIR, 'types'),
            },
            override: {
                useTypeOverInterfaces: true,
                enumGenerationType: 'const',
                zod: {
                    // TODO: once it's possible to upgrade to orval 8.13.0 in several days (>=14d old), enable following options to improve the output and mainly inferred types
                    // generateReusableSchemas: true,
                    // generateMeta: true,
                },
            },
        },
    },
});
