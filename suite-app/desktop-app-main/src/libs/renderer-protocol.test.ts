import { app, net, protocol } from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { ILogger } from './logger';
import {
    handleRendererProtocol,
    isRendererUrl,
    resolveByteRange,
    resolveRendererFile,
} from './renderer-protocol';

jest.mock('electron', () => ({
    app: { getAppPath: jest.fn() },
    net: { fetch: jest.fn() },
    protocol: { handle: jest.fn(), registerSchemesAsPrivileged: jest.fn() },
}));

const buildDir = path.join(path.sep, 'Applications', 'Trezor Suite.app', 'build');

const createLogger = (): ILogger => ({
    level: 'mute',
    config: {
        colors: false,
        writeToConsole: false,
        writeToDisk: false,
        outputFile: '',
        outputPath: '',
        logFormat: '',
        dedupeTimeout: 0,
        memoryCap: 0,
    },
    exit: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    getLog: jest.fn(() => []),
});

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

describe(resolveByteRange.name, () => {
    it.each([
        ['a closed range', 'bytes=2-5', { type: 'partial', start: 2, end: 5 }],
        ['an open range', 'bytes=4-', { type: 'partial', start: 4, end: 9 }],
        [
            'a range past the end, cut to the file',
            'bytes=8-100',
            { type: 'partial', start: 8, end: 9 },
        ],
        ['a suffix range', 'bytes=-3', { type: 'partial', start: 7, end: 9 }],
        ['a suffix longer than the file', 'bytes=-50', { type: 'partial', start: 0, end: 9 }],
        ['a start past the end', 'bytes=10-', { type: 'unsatisfiable' }],
        ['an empty suffix', 'bytes=-0', { type: 'unsatisfiable' }],
        ['several ranges', 'bytes=0-1,4-5', { type: 'whole' }],
        ['another unit', 'items=0-1', { type: 'whole' }],
        ['a reversed range', 'bytes=5-2', { type: 'whole' }],
        ['no bounds', 'bytes=-', { type: 'whole' }],
    ])('reads %s', (_, range, byteRange) => {
        expect(resolveByteRange({ range, size: 10 })).toEqual(byteRange);
    });

    it('cannot satisfy any range of an empty file', () => {
        expect(resolveByteRange({ range: 'bytes=0-', size: 0 })).toEqual({ type: 'unsatisfiable' });
        expect(resolveByteRange({ range: 'bytes=-1', size: 0 })).toEqual({ type: 'unsatisfiable' });
    });
});

describe(handleRendererProtocol.name, () => {
    const fileContent = '0123456789';
    let appDir: string;

    const serve = (headers: Record<string, string> = {}) => {
        const handler = jest.mocked(protocol.handle).mock.calls[0]?.[1];
        if (!handler) throw new Error('No protocol handler was registered');

        return handler(new Request('suite://app/videos/clip.webm', { headers }));
    };

    beforeEach(() => {
        appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'renderer-protocol-'));
        fs.mkdirSync(path.join(appDir, 'build', 'videos'), { recursive: true });
        fs.writeFileSync(path.join(appDir, 'build', 'videos', 'clip.webm'), fileContent);
        jest.mocked(app.getAppPath).mockReturnValue(appDir);
        jest.mocked(net.fetch).mockImplementation(() =>
            Promise.resolve(
                new Response('sliced by the file loader', {
                    headers: { 'Content-Type': 'video/webm' },
                }),
            ),
        );
        handleRendererProtocol({ logger: createLogger() });
    });

    afterEach(() => {
        jest.clearAllMocks();
        fs.rmSync(appDir, { recursive: true, force: true });
    });

    it('serves the whole file without a range', async () => {
        const response = await serve();

        expect(net.fetch).toHaveBeenCalledWith(expect.stringMatching(/^file:.*clip\.webm$/), {
            method: 'GET',
        });
        expect(response.status).toBe(200);
    });

    it('answers a byte range as partial content', async () => {
        const response = await serve({ Range: 'bytes=2-' });

        expect(net.fetch).toHaveBeenCalledWith(expect.stringMatching(/clip\.webm$/), {
            method: 'GET',
            headers: { range: 'bytes=2-9' },
        });
        expect(response.status).toBe(206);
        expect(response.headers.get('Content-Range')).toBe('bytes 2-9/10');
        expect(response.headers.get('Content-Length')).toBe('8');
        expect(response.headers.get('Accept-Ranges')).toBe('bytes');
        expect(response.headers.get('Content-Type')).toBe('video/webm');
    });

    it('refuses a range past the end of the file', async () => {
        const response = await serve({ Range: 'bytes=10-' });

        expect(net.fetch).not.toHaveBeenCalled();
        expect(response.status).toBe(416);
        expect(response.headers.get('Content-Range')).toBe('bytes */10');
    });

    it('serves the whole file for a range it does not read', async () => {
        const response = await serve({ Range: 'bytes=0-1,4-5' });

        expect(net.fetch).toHaveBeenCalledWith(expect.stringMatching(/clip\.webm$/), {
            method: 'GET',
        });
        expect(response.status).toBe(200);
    });
});
