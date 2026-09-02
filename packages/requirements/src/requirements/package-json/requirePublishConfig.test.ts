import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../Requirement';
import { requirePublishConfig } from './requirePublishConfig';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'publish-config-'));

const validPublicPackageJson = {
    name: '@trezor/example',
    main: 'src/index.ts',
    type: 'module',
    publishConfig: {
        main: './lib/index.js',
        types: './lib/index.d.ts',
        exports: {
            '.': { types: './lib/index.d.ts', default: './lib/index.js' },
            './lib/*': './lib/*',
        },
    },
    files: ['lib/', 'CHANGELOG.md'],
};

describe(requirePublishConfig.name, () => {
    let workspaceDir: string;
    let context: WorkspaceContext;

    beforeEach(() => {
        workspaceDir = createTempWorkspace();
        context = {
            repoRoot: '/repo',
            workspaceDir,
            workspaceName: '@trezor/example',
        };
    });

    afterEach(() => {
        rmSync(workspaceDir, { recursive: true, force: true });
    });

    it('has workspace scope', () => {
        expect(requirePublishConfig.scope).toBe('workspace');
    });

    describe('applies', () => {
        it('applies to packages with publishConfig.exports', () => {
            writeFileSync(
                join(workspaceDir, 'package.json'),
                JSON.stringify({ publishConfig: { exports: { '.': {} } } }),
            );

            expect(requirePublishConfig.applies?.(context)).toBe(true);
        });

        it('applies to packages with publishConfig but no exports', () => {
            writeFileSync(
                join(workspaceDir, 'package.json'),
                JSON.stringify({ publishConfig: { main: './lib/index.js' } }),
            );

            expect(requirePublishConfig.applies?.(context)).toBe(true);
        });

        it('does not apply to private packages without publishConfig', () => {
            writeFileSync(
                join(workspaceDir, 'package.json'),
                JSON.stringify({ name: '@trezor/example', private: true }),
            );

            expect(requirePublishConfig.applies?.(context)).toBe(false);
        });

        it('returns false when package.json is missing', () => {
            expect(requirePublishConfig.applies?.(context)).toBe(false);
        });
    });

    describe('verify - public package fields', () => {
        it('passes for a valid fully-configured public package', async () => {
            writeFileSync(
                join(workspaceDir, 'package.json'),
                JSON.stringify(validPublicPackageJson),
            );

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toEqual([]);
        });

        it('reports missing top-level main field', async () => {
            const { main: _, ...withoutMain } = validPublicPackageJson;
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(withoutMain));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Missing top-level "main" field');
        });

        it('reports missing publishConfig.main', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    main: undefined,
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Missing "publishConfig.main" field');
        });

        it('reports invalid publishConfig.main', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    main: './lib/index.mjs',
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain(
                '@trezor/example: Invalid "publishConfig.main": expected "./lib/index.js", got "./lib/index.mjs"',
            );
        });

        it('reports missing publishConfig.types', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    types: undefined,
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Missing "publishConfig.types" field');
        });

        it('reports invalid publishConfig.types', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    types: './lib/index.d.mts',
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain(
                '@trezor/example: Invalid "publishConfig.types": expected "./lib/index.d.ts", got "./lib/index.d.mts"',
            );
        });

        it('reports missing lib/ in files array', async () => {
            const pkg = {
                ...validPublicPackageJson,
                files: ['CHANGELOG.md'],
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: "files" must include "lib/"');
        });

        it('accepts "lib" without trailing slash in files array', async () => {
            const pkg = {
                ...validPublicPackageJson,
                files: ['lib'],
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors.filter(e => e.includes('"files"'))).toEqual([]);
        });

        it('reports missing top-level "type"', async () => {
            const { type: _, ...withoutType } = validPublicPackageJson;
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(withoutType));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain(
                '@trezor/example: ESM package must declare top-level "type": "module" (got undefined)',
            );
        });

        it('reports invalid top-level "type"', async () => {
            const pkg = { ...validPublicPackageJson, type: 'commonjs' };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain(
                '@trezor/example: ESM package must declare top-level "type": "module" (got "commonjs")',
            );
        });

        it('rejects redundant publishConfig.type', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    type: 'module',
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain(
                '@trezor/example: Redundant "publishConfig.type" field — declare "type" at the top level instead',
            );
        });
    });

    describe('verify - exports shape', () => {
        it('reports missing publishConfig.exports field', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    main: './lib/index.js',
                    types: './lib/index.d.ts',
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Missing publishConfig.exports field');
        });

        it('reports missing "." entry in publishConfig.exports', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        './lib/*': './lib/*',
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Missing publishConfig.exports["."]');
        });

        it('reports invalid "." export shape', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        '.': { types: './lib/index.d.mts', default: './lib/index.mjs' },
                        './lib/*': './lib/*',
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Invalid publishConfig.exports["."]');
        });

        it('reports invalid ./lib/* export shape when it uses the old CJS object config', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        '.': validPublicPackageJson.publishConfig.exports['.'],
                        './lib/*': { types: './lib/*.d.ts', default: './lib/*.js' },
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Invalid publishConfig.exports["./lib/*"]');
        });

        it('accepts explicit sub-path overrides', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        ...validPublicPackageJson.publishConfig.exports,
                        './lib/events': {
                            types: './lib/events/index.d.ts',
                            default: './lib/events/index.js',
                        },
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toEqual([]);
        });

        it('reports invalid publishConfig.exports when it is not an object', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: 'invalid',
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Invalid publishConfig.exports field');
        });

        it('reports wrong key order in shape-checked entry as invalid shape', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        '.': {
                            default: './lib/index.js',
                            types: './lib/index.d.ts',
                        },
                        './lib/*': './lib/*',
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Invalid publishConfig.exports["."]');
        });

        it('reports "types" after "default" in explicit override entries', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        ...validPublicPackageJson.publishConfig.exports,
                        './lib/events': {
                            default: './lib/events/index.js',
                            types: './lib/events/index.d.ts',
                        },
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain(
                '@trezor/example: In publishConfig.exports["./lib/events"]: "types" must come before "default"',
            );
        });
    });

    describe('verify - package.json errors', () => {
        it('reports missing package.json', async () => {
            const errors = await requirePublishConfig.verify(context);

            expect(errors).toEqual([
                '@trezor/example: package.json is missing or contains invalid JSON',
            ]);
        });

        it('reports invalid JSON in package.json', async () => {
            writeFileSync(join(workspaceDir, 'package.json'), '{ invalid json }');

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toEqual([
                '@trezor/example: package.json is missing or contains invalid JSON',
            ]);
        });
    });
});
