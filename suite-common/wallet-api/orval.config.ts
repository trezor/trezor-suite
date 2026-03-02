import { readdirSync } from 'fs';
import { Config, defineConfig } from 'orval';
import { resolve } from 'path';

import { OPENAPI_DIR } from './scripts/fetchSpec';

const openapiFiles = readdirSync(OPENAPI_DIR);

// eslint-disable-next-line import/no-default-export
export default defineConfig(
    openapiFiles.reduce<Config>((configs, openapiFilename) => {
        const openapiName = openapiFilename.split('.')[0];

        configs[openapiName] = {
            input: {
                target: resolve(OPENAPI_DIR, openapiFilename),
            },
            output: {
                mode: 'split',
                target: resolve(OPENAPI_DIR, '..', 'schemas', `${openapiName}.ts`),
                mock: false,
                // Use our custom Prettier config
                prettier: false,
                clean: true,
                tsconfig: './tsconfig.json',
                packageJson: './package.json',
                client: 'zod',
                override: {
                    useNamedParameters: true,
                    useTypeOverInterfaces: true,
                    enumGenerationType: 'const',
                },
            },
        };

        return configs;
    }, {}),
);
