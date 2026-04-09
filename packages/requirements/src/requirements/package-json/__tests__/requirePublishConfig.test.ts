import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requirePublishConfig } from '../requirePublishConfig';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'publish-config-'));

const validPublicPackageJson = {
    name: '@trezor/example',
    main: 'src/index.ts',
    publishConfig: {
        main: './lib/index.js',
        types: './lib/index.d.ts',
        exports: {
            '.': {
                import: { types: './libESM/index.d.mts', default: './libESM/index.mjs' },
                require: { types: './lib/index.d.ts', default: './lib/index.js' },
            },
            './lib/*': { types: './lib/*.d.ts', default: './lib/*.js' },
            './libESM/*': './libESM/*',
        },
    },
    files: ['lib/', 'libESM/', 'CHANGELOG.md'],
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

        it('reports missing lib/ in files array', async () => {
            const pkg = {
                ...validPublicPackageJson,
                files: ['libESM/', 'CHANGELOG.md'],
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: "files" must include "lib/"');
        });

        it('reports missing libESM/ in files array', async () => {
            const pkg = {
                ...validPublicPackageJson,
                files: ['lib/', 'CHANGELOG.md'],
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: "files" must include "libESM/"');
        });

        it('accepts "lib" (without trailing slash) in files array', async () => {
            const pkg = {
                ...validPublicPackageJson,
                files: ['lib', 'libESM'],
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors.filter(e => e.includes('"files"'))).toEqual([]);
        });
    });

    describe('verify - exports shape', () => {
        it('reports missing "." entry in publishConfig.exports', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        './lib/*': { default: './lib/*.js', types: './lib/*.d.ts' },
                        './libESM/*': { default: './libESM/*.mjs', types: './libESM/*.d.mts' },
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
                        '.': { import: './libESM/index.mjs', require: './lib/index.js' },
                        './lib/*': { default: './lib/*.js', types: './lib/*.d.ts' },
                        './libESM/*': { default: './libESM/*.mjs', types: './libESM/*.d.mts' },
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Invalid publishConfig.exports["."]');
        });

        it('reports missing lib counterpart for libESM entry', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        '.': validPublicPackageJson.publishConfig.exports['.'],
                        './libESM/*': './libESM/*',
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain(
                '@trezor/example: Missing counterpart "./lib/*" for "./libESM/*"',
            );
        });

        it('reports missing libESM counterpart for lib entry', async () => {
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

            expect(errors).toContain(
                '@trezor/example: Missing counterpart "./libESM/*" for "./lib/*"',
            );
        });

        it('accepts passthrough string format for libESM wildcards', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        '.': validPublicPackageJson.publishConfig.exports['.'],
                        './lib/*': { types: './lib/*.d.ts', default: './lib/*.js' },
                        './libESM/*': './libESM/*',
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toEqual([]);
        });

        it('accepts explicit sub-path overrides without requiring counterparts for those', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        '.': validPublicPackageJson.publishConfig.exports['.'],
                        './lib/*': { types: './lib/*.d.ts', default: './lib/*.js' },
                        './libESM/*': './libESM/*',
                        './lib/events': {
                            types: './lib/events/index.d.ts',
                            default: './lib/events/index.js',
                        },
                        './libESM/events': {
                            types: './libESM/events/index.d.mts',
                            default: './libESM/events/index.mjs',
                        },
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toEqual([]);
        });

        it('reports invalid or missing publishConfig.exports when it is not an object', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: 'invalid',
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain('@trezor/example: Missing publishConfig.exports["."]');
        });

        it('reports wrong key order in shape-checked entry as invalid shape', async () => {
            const pkg = {
                ...validPublicPackageJson,
                publishConfig: {
                    ...validPublicPackageJson.publishConfig,
                    exports: {
                        '.': {
                            import: {
                                default: './libESM/index.mjs',
                                types: './libESM/index.d.mts',
                            },
                            require: { types: './lib/index.d.ts', default: './lib/index.js' },
                        },
                        './lib/*': { types: './lib/*.d.ts', default: './lib/*.js' },
                        './libESM/*': './libESM/*',
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
                        '.': validPublicPackageJson.publishConfig.exports['.'],
                        './lib/*': { types: './lib/*.d.ts', default: './lib/*.js' },
                        './libESM/*': './libESM/*',
                        './lib/events': {
                            default: './lib/events/index.js',
                            types: './lib/events/index.d.ts',
                        },
                        './libESM/events': {
                            types: './libESM/events/index.d.mts',
                            default: './libESM/events/index.mjs',
                        },
                    },
                },
            };
            writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(pkg));

            const errors = await requirePublishConfig.verify(context);

            expect(errors).toContain(
                '@trezor/example: In publishConfig.exports["./lib/events"]: "types" must come before "default"',
            );
            expect(errors).not.toContain(
                '@trezor/example: In publishConfig.exports["./libESM/events"]: "types" must come before "default"',
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
