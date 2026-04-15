import { ClientGeneratorsBuilder, defineConfig } from 'orval';
import { resolve } from 'path';

const pascalCase = (value: string) =>
    value
        .replace(/[_-]+([a-z0-9])/g, (_, char: string) => char.toUpperCase())
        .replace(/^[a-z]/, char => char.toUpperCase());

const camelCase = (value: string) => value.replace(/^[A-Z]/, char => char.toLowerCase());

const OUTPUT_DIR = resolve(import.meta.dirname, './src/api');

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    worker: {
        input: {
            target: resolve(import.meta.dirname, './openapi.yaml'),
        },
        output: {
            mode: 'tags',
            target: resolve(OUTPUT_DIR, 'index.ts'),
            mock: false,
            // Use our custom Prettier config
            prettier: false,
            clean: true,
            tsconfig: './tsconfig.json',
            packageJson: './package.json',
            propertySortOrder: 'Specification',
            client: clients => {
                const fetchClient = clients.fetch;

                return {
                    ...fetchClient,
                    client: async (verbOptions, options, output) => {
                        const result = await fetchClient.client(verbOptions, options, output);
                        const methodName = camelCase(verbOptions.operationName);

                        return {
                            ...result,
                            // Make sure the exported methods are in camelCase
                            implementation: result.implementation.replace(
                                // Exclude `async` too because there's some Eslint requiring await in async functions ignoring the given fn can return a promise
                                `export const ${verbOptions.operationName} = async`,
                                `export const ${methodName} =`,
                            ),
                        };
                    },
                } satisfies ClientGeneratorsBuilder;
            },
            // Prefer `fetch` over `axios`
            httpClient: 'fetch',
            indexFiles: true,
            // Include response headers in the generated types and method results
            headers: true,
            workspace: OUTPUT_DIR,
            override: {
                useNamedParameters: true,
                useTypeOverInterfaces: true,
                enumGenerationType: 'const',

                transformer: verb => {
                    const prefix = verb.operationId.split('_')[0] ?? '';

                    return {
                        ...verb,
                        // Make TS types PascalCase and remove the group prefix
                        operationName: pascalCase(verb.operationName).replace(prefix, ''),
                    };
                },
                mutator: {
                    name: 'httpClient',
                    path: resolve(import.meta.dirname, './src/httpClient.ts'),
                },
                fetch: {
                    forceSuccessResponse: true,
                },
            },
        },
    },
});
