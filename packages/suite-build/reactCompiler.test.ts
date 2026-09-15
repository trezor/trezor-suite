import { existsSync, readFileSync } from 'fs';
import path from 'path';

import {
    REACT_COMPILER_PATHS,
    assertReactCompilerPathsAreValid,
    getInvalidReactCompilerPaths,
    getUnmatchedReactCompilerPaths,
    matchReactCompilerPaths,
    shouldCompileWithReactCompiler,
} from './reactCompiler';

/**
 * Every path below is built from the real repository root on purpose. A test using `/repo/...`
 * literals would pass while the build is wrong: this checkout's own directory is named
 * `trezor-suite`, so the fragment `suite/` occurs in the absolute path of every file in the repo
 * and a substring-based filter silently matches everything, `suite-native` included.
 */
const repoRoot = path.resolve(__dirname, '../..');
const repoFile = (...segments: string[]) => path.join(repoRoot, ...segments);

describe('reactCompiler repo root', () => {
    it('is the trezor-suite checkout, so the paths below are the ones babel really sees', () => {
        const rootManifest = JSON.parse(readFileSync(repoFile('package.json'), 'utf-8'));

        expect(rootManifest.name).toBe('trezor-suite');
    });
});

describe('the substring landmine', () => {
    // Spelled out rather than taken from `repoRoot`, so this holds however the developer named
    // their checkout directory — while still being the name CI and the README use.
    const hazardousRoot = path.resolve(path.sep, 'home', 'runner', 'work', 'trezor-suite');

    it('rejects the paths a substring filter would wrongly accept', () => {
        const outOfScope = [
            'packages/connect/src/index.ts',
            'suite-native/app/App.tsx',
            'suite-common/wallet-core/src/index.ts',
        ];

        outOfScope.forEach(relativePath => {
            const filename = path.join(hazardousRoot, relativePath);

            // The checkout's own directory name supplies the `suite/` fragment, which is why
            // `babel-plugin-react-compiler`'s `sources` option cannot be used to scope a wave.
            expect(filename).toContain('suite/');
            expect(matchReactCompilerPaths(filename, ['suite'], hazardousRoot)).toEqual([]);
        });
    });

    it('still matches the directory that was actually listed', () => {
        expect(
            matchReactCompilerPaths(
                path.join(hazardousRoot, 'suite/router-config/src/index.ts'),
                ['suite'],
                hazardousRoot,
            ),
        ).toEqual(['suite']);
    });
});

describe('matchReactCompilerPaths', () => {
    it('matches a file inside a listed directory', () => {
        expect(
            matchReactCompilerPaths(repoFile('packages/suite/src/views/dashboard/index.ts'), [
                'packages/suite',
            ]),
        ).toEqual(['packages/suite']);
    });

    it('does not match sibling packages that merely share the listed prefix', () => {
        const siblings = [
            'packages/suite-build/webpack.config.ts',
            'packages/suite-storage/src/index.ts',
        ];

        siblings.forEach(sibling => {
            expect(matchReactCompilerPaths(repoFile(sibling), ['packages/suite'])).toEqual([]);
        });
    });

    it('does not match suite-native when the @suite/* workspace root is listed', () => {
        expect(
            matchReactCompilerPaths(repoFile('suite/router-config/src/index.ts'), ['suite']),
        ).toEqual(['suite']);
        expect(matchReactCompilerPaths(repoFile('suite-native/app/App.tsx'), ['suite'])).toEqual(
            [],
        );
        expect(
            matchReactCompilerPaths(repoFile('suite-common/wallet-core/src/index.ts'), ['suite']),
        ).toEqual([]);
    });

    it('does not match packages reached through the checkout directory name', () => {
        expect(
            matchReactCompilerPaths(repoFile('packages/connect/src/index.ts'), ['suite']),
        ).toEqual([]);
        expect(
            matchReactCompilerPaths(repoFile('packages/connect/src/index.ts'), ['packages/suite']),
        ).toEqual([]);
    });

    it('matches a directory listed below a package root', () => {
        expect(
            matchReactCompilerPaths(repoFile('packages/suite/src/hooks/wallet/useSendForm.ts'), [
                'packages/suite/src/hooks',
            ]),
        ).toEqual(['packages/suite/src/hooks']);
        expect(
            matchReactCompilerPaths(repoFile('packages/suite/src/views/wallet/send/index.ts'), [
                'packages/suite/src/hooks',
            ]),
        ).toEqual([]);
    });

    it('never matches the listed directory itself, only files below it', () => {
        expect(matchReactCompilerPaths(repoFile('packages/suite'), ['packages/suite'])).toEqual([]);
    });

    it('does not match files outside the repository root', () => {
        expect(
            matchReactCompilerPaths(path.resolve(repoRoot, '../other-repo/packages/suite/a.ts'), [
                'packages/suite',
            ]),
        ).toEqual([]);
        expect(matchReactCompilerPaths(repoRoot, ['packages/suite'])).toEqual([]);
    });

    it('returns every matching entry, so a nested entry is not left looking unmatched', () => {
        // Recording only the outer entry would make the build-end coverage check fail forever over
        // `packages/suite/src/hooks`, whose files are in fact being compiled.
        expect(
            matchReactCompilerPaths(repoFile('packages/suite/src/hooks/wallet/useSendForm.ts'), [
                'packages/suite',
                'packages/suite/src/hooks',
            ]),
        ).toEqual(['packages/suite', 'packages/suite/src/hooks']);
    });

    it('matches nothing when the list is empty', () => {
        expect(matchReactCompilerPaths(repoFile('packages/suite/src/index.ts'), [])).toEqual([]);
    });

    it('ignores the query suffix rolldown appends to module ids', () => {
        expect(
            matchReactCompilerPaths(`${repoFile('packages/suite/src/index.ts')}?v=1`, [
                'packages/suite',
            ]),
        ).toEqual(['packages/suite']);
    });

    it('does not match real dependencies under node_modules', () => {
        // `node_modules` as the listed directory, so a plain non-match cannot be what rejects this.
        expect(
            matchReactCompilerPaths(repoFile('node_modules/react/index.js'), ['node_modules']),
        ).toEqual([]);
    });

    it('does not match a relative id, which would otherwise resolve against the cwd', () => {
        expect(matchReactCompilerPaths('packages/suite/src/index.ts', ['packages/suite'])).toEqual(
            [],
        );
    });

    it('does not match virtual modules or a missing filename', () => {
        expect(matchReactCompilerPaths(undefined, ['packages/suite'])).toEqual([]);
        expect(matchReactCompilerPaths('\0virtual:buffer-polyfill', ['packages/suite'])).toEqual(
            [],
        );
        expect(matchReactCompilerPaths('', ['packages/suite'])).toEqual([]);
    });
});

describe('REACT_COMPILER_PATHS', () => {
    it('only lists directories that exist in this checkout', () => {
        expect(getInvalidReactCompilerPaths()).toEqual([]);
        expect(() => assertReactCompilerPathsAreValid()).not.toThrow();
    });

    it('reports entries that do not exist, so a typo or a rename fails the build', () => {
        expect(getInvalidReactCompilerPaths(['packages/suite', 'packages/gone'], repoRoot)).toEqual(
            ['packages/gone'],
        );
    });

    it('reports entries the segment match could never accept', () => {
        const unmatchable = [
            'packages/suite/', // trailing separator
            './packages/suite', // leading './'
            '../packages/suite', // escapes the root
            'packages\\suite', // Windows-spelled
            repoFile('packages/suite'), // absolute
            'packages/suite/package.json', // a file, not a directory
            '',
        ];

        expect(getInvalidReactCompilerPaths(unmatchable, repoRoot)).toEqual(unmatchable);
    });

    it('lists repo-root-relative paths without leading or trailing separators', () => {
        REACT_COMPILER_PATHS.forEach(directory => {
            expect(directory).not.toMatch(/^[/\\]/);
            expect(directory).not.toMatch(/[/\\]$/);
            expect(existsSync(repoFile(directory))).toBe(true);
        });
    });
});

describe('shouldCompileWithReactCompiler', () => {
    const originalFlag = process.env.REACT_COMPILER;

    afterEach(() => {
        if (originalFlag === undefined) {
            delete process.env.REACT_COMPILER;
        } else {
            process.env.REACT_COMPILER = originalFlag;
        }
    });

    it('compiles nothing while no wave is enabled', () => {
        expect(REACT_COMPILER_PATHS).toEqual([]);
        expect(shouldCompileWithReactCompiler(repoFile('packages/suite/src/index.ts'))).toBe(false);
    });
});

/**
 * What fails the webpack build when a wave entry matches no file — `base.webpack.config.ts:63-72`,
 * the guard against a rollout that stays green while shipping uncompiled code. It shipped untested
 * with the commit that introduced it.
 */
describe('getUnmatchedReactCompilerPaths', () => {
    it('reports every wave before a build has compiled anything', () => {
        // `matchedPaths` accumulates for the life of the process, and the tests above have already
        // matched every wave, so this needs a module instance nothing has touched.
        jest.isolateModules(() => {
            const fresh = require('./reactCompiler');

            expect(fresh.getUnmatchedReactCompilerPaths()).toEqual([...REACT_COMPILER_PATHS]);
        });
    });

    it('reports nothing once a file under every wave has been compiled', () => {
        REACT_COMPILER_PATHS.forEach(directory => {
            shouldCompileWithReactCompiler(repoFile(directory, 'Component.tsx'));
        });

        expect(getUnmatchedReactCompilerPaths()).toEqual([]);
    });

    it('still reports a wave whose files were all excluded', () => {
        jest.isolateModules(() => {
            const fresh = require('./reactCompiler');
            const [firstWave] = REACT_COMPILER_PATHS;

            // A file outside every wave: asking about it must not mark anything as matched.
            fresh.shouldCompileWithReactCompiler(repoFile('suite-native/app/App.tsx'));

            expect(fresh.getUnmatchedReactCompilerPaths()).toContain(firstWave);
        });
    });
});
