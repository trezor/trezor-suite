import { getWorkerUrlWithoutQuery, precacheExcludePatterns, selectPrecachedEntries } from './index';

describe(selectPrecachedEntries.name, () => {
    it('precaches the files whose names carry a content hash, and the static fonts and videos', () => {
        const hashedChunk = { url: '/web/js/1234.0a1b2c3d4e5f.js', revision: null, size: 10 };
        const font = {
            url: '/web/static/fonts/TTSatoshi/TTSatoshi-Medium.woff2',
            revision: 'abc',
            size: 20,
        };
        const video = {
            url: '/web/static/videos/device/t3t1/rotate_color_1.webm',
            revision: 'def',
            size: 30,
        };
        const sharedWorkerScript = {
            url: '/web/js/workers/sessions-background-sharedworker.js',
            revision: 'ghi',
            size: 40,
        };
        const faviconScript = { url: '/web/static/favicon.js', revision: 'jkl', size: 50 };

        expect(
            selectPrecachedEntries([hashedChunk, font, video, sharedWorkerScript, faviconScript]),
        ).toEqual({ manifest: [hashedChunk, font, video] });
    });
});

describe('precacheExcludePatterns', () => {
    const isExcluded = (assetName: string) =>
        precacheExcludePatterns.some(pattern => pattern.test(assetName));

    it.each([
        'static/fonts/fonts.css',
        'static/videos/device/t3t1/rotate_color_1.webm',
        'static/images/favicons/favicon.png',
    ])('lets %s into the precache', assetName => {
        expect(isExcluded(assetName)).toBe(false);
    });

    it.each(['static/favicon.js', 'static/fonts-legacy/font.woff2'])(
        'keeps %s out of the precache',
        assetName => {
            expect(isExcluded(assetName)).toBe(true);
        },
    );
});

describe(getWorkerUrlWithoutQuery.name, () => {
    it.each([
        ['/sw.js?dev-logs', '/sw.js'],
        ['/web/sw.js?dev-logs', '/web/sw.js'],
    ])('cuts the query off the worker URL %s', (url, expected) => {
        expect(getWorkerUrlWithoutQuery(url)).toBe(expected);
    });

    it.each([['/sw.js'], ['/static/sw.js.map?x'], ['/index.html?dev-logs'], [undefined]])(
        'leaves %s alone',
        url => {
            expect(getWorkerUrlWithoutQuery(url)).toBeUndefined();
        },
    );
});
