import { extractBranch, getSuiteWebUrl } from '../getSuiteWebUrl';

const DEV_ORIGIN = 'https://dev.suite.sldev.cz';

describe('extractBranch', () => {
    it('extracts single-segment branch from methods page', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/develop/methods/bitcoin/getAddress`)).toBe(
            'develop',
        );
    });

    it('extracts single-segment branch from settings page', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/develop/settings/`)).toBe('develop');
    });

    it('extracts multi-segment branch from methods page', () => {
        expect(
            extractBranch(`${DEV_ORIGIN}/connect/feat/xyz/phase-1/methods/bitcoin/getAddress`),
        ).toBe('feat/xyz/phase-1');
    });

    it('extracts multi-segment branch from settings page', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/feat/xyz/settings/`)).toBe('feat/xyz');
    });

    it('extracts branch from root URL (no page segment)', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/develop`)).toBe('develop');
    });

    it('extracts multi-segment branch from root URL', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/feat/xyz`)).toBe('feat/xyz');
    });

    it('extracts branch from root URL with trailing slash', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/develop/`)).toBe('develop');
    });

    it('extracts multi-segment branch from root URL with trailing slash', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/feat/xyz/`)).toBe('feat/xyz');
    });

    it('treats bare /settings without trailing slash as part of branch name', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/develop/settings`)).toBe('develop/settings');
    });

    it('handles branch name containing "methods" word', () => {
        expect(
            extractBranch(`${DEV_ORIGIN}/connect/fix/methods-refactor/methods/bitcoin/getAddress`),
        ).toBe('fix/methods-refactor');
    });

    it('handles branch name containing "settings" word', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/fix/settings-page/settings/`)).toBe(
            'fix/settings-page',
        );
    });

    it('preserves branch named fix/methods at root URL', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/fix/methods`)).toBe('fix/methods');
    });

    it('preserves branch named fix/settings at root URL', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/fix/settings`)).toBe('fix/settings');
    });

    it('strips /methods/ delimiter even when branch contains methods', () => {
        expect(extractBranch(`${DEV_ORIGIN}/connect/fix/methods/methods/bitcoin/getAddress`)).toBe(
            'fix/methods',
        );
    });

    it('returns undefined for non-matching URL', () => {
        expect(extractBranch('https://example.com/other/path')).toBeUndefined();
    });
});

describe('getSuiteWebUrl', () => {
    it('returns localhost popup URL for local dev', () => {
        expect(getSuiteWebUrl('http://localhost:8088/settings/', 'http://localhost:8088')).toBe(
            'http://localhost:8000/connect-popup',
        );
    });

    it('returns dev popup URL for dev methods page', () => {
        expect(
            getSuiteWebUrl(`${DEV_ORIGIN}/connect/develop/methods/bitcoin/getAddress`, DEV_ORIGIN),
        ).toBe(`${DEV_ORIGIN}/suite-web/develop/web/connect-popup`);
    });

    it('returns dev popup URL for dev settings page', () => {
        expect(getSuiteWebUrl(`${DEV_ORIGIN}/connect/develop/settings/`, DEV_ORIGIN)).toBe(
            `${DEV_ORIGIN}/suite-web/develop/web/connect-popup`,
        );
    });

    it('returns dev popup URL with multi-segment branch', () => {
        expect(
            getSuiteWebUrl(`${DEV_ORIGIN}/connect/feat/xyz/methods/bitcoin/getAddress`, DEV_ORIGIN),
        ).toBe(`${DEV_ORIGIN}/suite-web/feat/xyz/web/connect-popup`);
    });

    it('returns production URL for non-dev origin', () => {
        expect(getSuiteWebUrl('https://example.com/', 'https://example.com')).toBe(
            'https://suite.trezor.io/web/connect-popup',
        );
    });
});
