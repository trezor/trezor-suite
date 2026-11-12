import path from 'path';

import { isRendererUrl, resolveRendererFile } from './renderer-protocol';

jest.mock('electron', () => ({
    app: { getAppPath: jest.fn() },
    net: { fetch: jest.fn() },
    protocol: { handle: jest.fn(), registerSchemesAsPrivileged: jest.fn() },
}));

const buildDir = path.join(path.sep, 'Applications', 'Trezor Suite.app', 'build');

describe(resolveRendererFile.name, () => {
    it('maps the index page onto the build directory', () => {
        expect(resolveRendererFile({ buildDir, url: 'suite://app/index.html' })).toEqual({
            success: true,
            payload: path.join(buildDir, 'index.html'),
        });
    });

    it('decodes percent-encoded paths', () => {
        expect(
            resolveRendererFile({ buildDir, url: 'suite://app/static/images/trezor%20logo.svg' }),
        ).toEqual({
            success: true,
            payload: path.join(buildDir, 'static', 'images', 'trezor logo.svg'),
        });
    });

    it('ignores the query and the fragment', () => {
        expect(resolveRendererFile({ buildDir, url: 'suite://app/js/main.js?v=1#top' })).toEqual({
            success: true,
            payload: path.join(buildDir, 'js', 'main.js'),
        });
    });

    it('stays inside the build directory', () => {
        // The URL parser collapses `..` segments, encoded or not, against the root of the
        // origin, so they can only ever point back into the build directory.
        expect(resolveRendererFile({ buildDir, url: 'suite://app/../dist/app.js' })).toEqual({
            success: true,
            payload: path.join(buildDir, 'dist', 'app.js'),
        });
        expect(resolveRendererFile({ buildDir, url: 'suite://app/js/%2e%2e/%2e%2e/x' })).toEqual({
            success: true,
            payload: path.join(buildDir, 'x'),
        });
    });

    it('refuses directories', () => {
        expect(resolveRendererFile({ buildDir, url: 'suite://app/' })).toEqual({
            success: false,
            error: 'Path escapes the build directory: suite://app/',
        });
        expect(resolveRendererFile({ buildDir, url: 'suite://app/static/' })).toEqual({
            success: false,
            error: 'Path escapes the build directory: suite://app/static/',
        });
    });

    it('refuses other hosts and schemes', () => {
        expect(resolveRendererFile({ buildDir, url: 'suite://other/index.html' })).toEqual({
            success: false,
            error: 'Unexpected origin: suite://other/index.html',
        });
        expect(resolveRendererFile({ buildDir, url: 'file:///etc/passwd' })).toEqual({
            success: false,
            error: 'Unexpected origin: file:///etc/passwd',
        });
    });

    it('refuses malformed input', () => {
        expect(resolveRendererFile({ buildDir, url: 'not a url' })).toEqual({
            success: false,
            error: 'Malformed URL: not a url',
        });
        expect(resolveRendererFile({ buildDir, url: 'suite://app/%E0%A4%A' })).toEqual({
            success: false,
            error: 'Malformed path: suite://app/%E0%A4%A',
        });
    });
});

describe(isRendererUrl.name, () => {
    it.each(['suite://app/index.html', 'suite://app/index.html?x=1#top', 'suite://app/js/main.js'])(
        'accepts %s',
        url => {
            expect(isRendererUrl(url)).toBe(true);
        },
    );

    it.each([
        ['another host that starts like it', 'suite://app.evil/index.html'],
        ['a port', 'suite://app:80/index.html'],
        ['credentials', 'suite://user:password@app/index.html'],
        ['another scheme', 'https://app/index.html'],
        ['no host', 'suite:app/index.html'],
        ['spaces the parser would drop', ' suite://app/index.html '],
        ['a newline the parser would drop', 'suite://app/index.html\n'],
        ['a malformed URL', 'not a url'],
        ['no URL', undefined],
    ])('refuses %s', (_, url) => {
        expect(isRendererUrl(url)).toBe(false);
    });
});
