import { defineConfig } from 'orval';
import { resolve } from 'path';

const API_DIR = resolve(import.meta.dirname, './src/api');

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    evmNetworks: {
        input: {
            // A copy of `openapi.json` from trezor-fiat-rates-service, which owns the contract.
            target: './openapi.json',
            filters: { tags: ['networks'] },
        },
        output: {
            mode: 'single',
            target: resolve(API_DIR, 'index.ts'),
            clean: true,
            tsconfig: './tsconfig.json',
            packageJson: './package.json',
            fileExtension: '.ts',
            client: clients => ({
                ...clients.zod,
                // Generated schemas import zod through `@trezor/zod`, which turns off zod's JIT.
                dependencies: (...args) =>
                    (clients.zod.dependencies?.(...args) ?? []).map(dependency =>
                        dependency.dependency === 'zod'
                            ? { ...dependency, dependency: '@trezor/zod' }
                            : dependency,
                    ),
            }),
        },
    },
});
