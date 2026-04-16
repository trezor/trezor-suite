import { ClientGeneratorsBuilder, defineConfig } from 'orval';
import { resolve } from 'path';

import { EARN_API_BASE_URL } from './src/constants';

const camelCase = (value: string) => value.replace(/^[A-Z]/, char => char.toLowerCase());

function renameAllExportsToCamelCase(implementation: string): string {
    const pascalCaseNames: string[] = [];
    const re = /export const ([A-Z][a-zA-Z0-9_]*) =/g;
    let match;
    while ((match = re.exec(implementation)) !== null) {
        const name = match[1];
        if (name) {
            pascalCaseNames.push(name);
        }
    }

    let result = implementation;

    for (const name of pascalCaseNames) {
        result = result.replace(new RegExp(`\\b${name}\\b`, 'g'), camelCase(name));
    }

    return result;
}

const API_DIR = resolve(import.meta.dirname, './src/api');

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    earn: {
        input: {
            target: `${EARN_API_BASE_URL}/openapi`,
        },
        output: {
            mode: 'split',
            mock: false,
            target: resolve(API_DIR, 'schemas', 'index.ts'),
            prettier: false,
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
                            implementation: renameAllExportsToCamelCase(result.implementation),
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
            },
        },
    },
});
