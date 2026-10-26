import { getCommitsSinceLastStableRelease } from './connect-changelog';

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
