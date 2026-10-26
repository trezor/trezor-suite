import { getCommitsSinceLastStableRelease } from './connect-changelog';

const commitLine = (subject: string) => `-   ${subject} (abc1234)`;

describe('getCommitsSinceLastStableRelease', () => {
    it('stops at the per-package release marker', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/utils 1.2.3'),
            commitLine('fix(utils): older fix'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([
            commitLine('feat(connect): new method'),
        ]);
    });

    it('returns nothing when the previous release is the newest commit', () => {
        const commitLines = [
            commitLine('npm-release: @trezor/utils 1.2.3'),
            commitLine('fix(utils): older fix'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([]);
    });

    // The three cases below pin current behaviour, which is wrong: the boundary is a plain
    // substring match on a per-package marker, nothing more.
    it('documents a bug: the connect-wide release marker is not a boundary', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/connect 10.0.1'),
            commitLine('fix(utils): older fix'),
        ];

        // The whole path-scoped log is kept, which is why a package that only ever shipped under a
        // connect-wide marker got its entire history dumped into one changelog entry.
        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual(commitLines);
    });

    it('documents a bug: a prerelease marker is taken as the boundary', () => {
        const commitLines = [
            commitLine('feat(connect): new method'),
            commitLine('npm-release: @trezor/utils 1.2.3-beta.1'),
            commitLine('fix(utils): older fix'),
            commitLine('npm-release: @trezor/utils 1.2.2'),
            commitLine('fix(utils): released fix'),
        ];

        // A prerelease was never published as a stable version, so a stable changelog bounded by it
        // is missing everything down to the last stable release.
        expect(getCommitsSinceLastStableRelease(commitLines, 'utils')).toEqual([
            commitLine('feat(connect): new method'),
        ]);
    });

    it('documents a bug: a same-prefix package marker is taken as the boundary', () => {
        const commitLines = [
            commitLine('feat(blockchain-link): new method'),
            commitLine('npm-release: @trezor/blockchain-link-utils 1.2.3'),
            commitLine('fix(blockchain-link): older fix'),
        ];

        expect(getCommitsSinceLastStableRelease(commitLines, 'blockchain-link')).toEqual([
            commitLine('feat(blockchain-link): new method'),
        ]);
    });
});
