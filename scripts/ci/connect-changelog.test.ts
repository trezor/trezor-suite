import { filterChangelogCommits, getCommitsSinceLastStableRelease } from './connect-changelog';

const commitLine = (subject: string) => `-   ${subject} (abc1234)`;

describe('getCommitsSinceLastStableRelease', () => {
    it('stops at the per-package stable release marker', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/utils 1.2.3'),
            commitLine('fix(utils): older fix'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([
            commitLine('feat(connect): new method'),
        ]);
    });

    it('falls back to the connect-wide marker when the package has none', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/connect 10.0.1'),
            commitLine('fix(utils): older fix'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([
            commitLine('feat(connect): new method'),
        ]);
    });

    it('accepts the legacy connect-wide marker', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('release: connect 9.4.0'),
            commitLine('fix(utils): older fix'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([
            commitLine('feat(connect): new method'),
        ]);
    });

    it('stops at the connect-wide marker when it is nearer than the per-package one', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/connect 10.1.0'),
            commitLine('fix(utils): released fix'),
            commitLine('npm-release: @trezor/utils 1.2.3'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([
            commitLine('feat(connect): new method'),
        ]);
    });

    it('does not stop at a same-prefix package release', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/connect-webextension 10.0.1'),
            commitLine('fix(connect): older fix'),
            commitLine('npm-release: @trezor/connect 10.0.1'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'connect-web')).toEqual(
            commitLines.slice(0, 3),
        );
    });

    it('returns nothing when the previous release is the newest commit', () => {
        const commitLines = [
            commitLine('npm-release: @trezor/utils 1.2.3'),
            commitLine('fix(utils): older fix'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([]);
    });

    it('does not treat a prerelease marker as a boundary', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/utils 1.2.3-beta.1'),
            commitLine('fix(utils): older fix'),
            commitLine('npm-release: @trezor/utils 1.2.2'),
            commitLine('fix(utils): released fix'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/utils 1.2.3-beta.1'),
            commitLine('fix(utils): older fix'),
        ]);
    });

    it('warns and keeps the whole log when no stable marker is found', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const commitLines = [commitLine('feat(connect): new method'), commitLine('chore: sweep')];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual(commitLines);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('@trezor/utils'));

        warn.mockRestore();
    });
});

describe('filterChangelogCommits', () => {
    it.each([
        'feat: add something',
        'feat(connect): add something',
        'fix(utils): fix something',
        'perf(connect): speed something up',
        'refactor(connect): move something',
        'revert(connect): revert something',
        'Revert "feat(connect): add something"',
    ])('keeps %s', subject => {
        expect(filterChangelogCommits([commitLine(subject)], 'utils')).toEqual([
            commitLine(subject),
        ]);
    });

    it.each([
        'chore: bump something',
        'chore(connect): bump something',
        'test(connect): add a test',
        'ci: tweak a workflow',
        'build(connect): tweak the bundle',
        'style: reformat',
        'docs(connect): document something',
        'npm-release: @trezor/utils 1.2.3',
        'npm-prerelease(connect): @trezor/utils 1.2.3-beta.1',
        'release: connect 9.4.0',
    ])('drops %s', subject => {
        expect(filterChangelogCommits([commitLine(subject)], 'utils')).toEqual([]);
    });

    it('drops a foreign-scoped sweep from a connect entry point', () => {
        const commitLines = [
            commitLine('feat(logger): create and use `@trezor/logger` package'),
            commitLine('refactor(connect): share webextension <-> Suite Web channel identifiers'),
            commitLine('fix(connect-web): fix something here'),
            commitLine('fix: unscoped change'),
        ];

        expect(filterChangelogCommits(commitLines, 'connect-web')).toEqual(commitLines.slice(1, 3));
    });

    it('drops an unscoped sweep from a connect entry point', () => {
        expect(
            filterChangelogCommits([commitLine('feat: update typescript')], 'connect-web'),
        ).toEqual([]);
    });

    it('keeps a foreign-scoped commit for a package without a scope allow-list', () => {
        const sweep = commitLine('feat(logger): create and use `@trezor/logger` package');

        expect(filterChangelogCommits([sweep], 'utils')).toEqual([sweep]);
    });

    it('keeps a foreign- or unscoped commit that touched the entry point source', () => {
        const foreignScoped = commitLine('feat(suite-web): make permissions query optional');
        const unscoped = commitLine('fix: resolve errors across the codebase');
        const sweep = commitLine('feat(logger): create and use `@trezor/logger` package');
        const commitsTouchingSrc = new Set([foreignScoped, unscoped]);

        expect(
            filterChangelogCommits(
                [foreignScoped, unscoped, sweep],
                'connect-web',
                commitsTouchingSrc,
            ),
        ).toEqual([foreignScoped, unscoped]);
    });

    it('drops a non-user-facing commit that touched the entry point source', () => {
        const chore = commitLine('chore(deps): bump something');

        expect(filterChangelogCommits([chore], 'connect-web', new Set([chore]))).toEqual([]);
    });
});
