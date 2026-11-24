import path from 'path';
import { fileURLToPath } from 'url';

import type * as RendererLocation from './rendererLocation';

type Platform = 'posix' | 'win32';

type LoadIsFileUrlInsideDirectoryParams = {
    platform: Platform;
    appPath: string;
};

// Both `path` and `fileURLToPath` follow the platform the tests run on, so the other one is emulated.
const loadIsFileUrlInsideDirectory = ({
    platform,
    appPath,
}: LoadIsFileUrlInsideDirectoryParams) => {
    jest.resetModules();
    jest.doMock('electron', () => ({ app: { getAppPath: () => appPath } }));
    jest.doMock('path', () => path[platform]);
    jest.doMock('url', () => ({
        fileURLToPath: (fileUrl: URL) => fileURLToPath(fileUrl, { windows: platform === 'win32' }),
    }));

    return jest.requireActual<typeof RendererLocation>('./rendererLocation')
        .isFileUrlInsideDirectory;
};

const APP_ASAR_PATH = 'Trezor%20Suite/resources/app.asar';

describe('isFileUrlInsideDirectory', () => {
    describe('on a unix-like system', () => {
        const appUrl = `file:///opt/${APP_ASAR_PATH}`;
        const rendererUrl = `${appUrl}/build`;
        const isFileUrlInsideDirectory = loadIsFileUrlInsideDirectory({
            platform: 'posix',
            appPath: path.posix.join('/opt', decodeURIComponent(APP_ASAR_PATH)),
        });

        it.each([
            ['the entry point', `${rendererUrl}/index.html`],
            ['a nested file', `${rendererUrl}/static/js/main.js`],
            ['a file with a query and a hash', `${rendererUrl}/index.html?debug=1#/settings`],
            [
                'a file addressed with the localhost host',
                `file://localhost/opt/${APP_ASAR_PATH}/build/index.html`,
            ],
            ['a percent-encoded path', `${appUrl}/%62uild/index.html`],
            ['a file name starting with two dots', `${rendererUrl}/..assets/index.js`],
            ['a dot segment staying inside the directory', `${rendererUrl}/static/../index.html`],
        ])('allows %s', (_description, fileUrl) => {
            expect(isFileUrlInsideDirectory(new URL(fileUrl))).toBe(true);
        });

        it.each([
            ['the directory itself', rendererUrl],
            ['the directory itself with a trailing slash', `${rendererUrl}/`],
            ['the parent directory', appUrl],
            ['a sibling sharing the directory name prefix', `${rendererUrl}-evil/index.html`],
            ['a sibling file in the parent directory', `${rendererUrl}/../package.json`],
            ['a dot segment escaping the directory', `${rendererUrl}/../../../../etc/passwd`],
            [
                'an encoded dot segment escaping the directory',
                `${rendererUrl}/%2e%2e/%2e%2e/secret`,
            ],
            ['a different directory', 'file:///etc/passwd'],
            ['a percent-encoded different directory', 'file:///%65tc/passwd'],
            ['the filesystem root', 'file:///'],
            ['a path differing only in letter case', `${appUrl}/BUILD/index.html`],
        ])('rejects %s', (_description, fileUrl) => {
            expect(isFileUrlInsideDirectory(new URL(fileUrl))).toBe(false);
        });

        it.each([
            ['an encoded slash', `${rendererUrl}/static%2F..%2F..%2Findex.html`],
            ['a remote host', `file://remote-host/opt/${APP_ASAR_PATH}/build/index.html`],
            ['a different protocol', `https://example.com/opt/${APP_ASAR_PATH}/build/index.html`],
        ])('rejects a URL that cannot be converted to a path: %s', (_description, fileUrl) => {
            expect(isFileUrlInsideDirectory(new URL(fileUrl))).toBe(false);
        });
    });

    describe('on Windows', () => {
        const appUrl = `file:///C:/Program%20Files/${APP_ASAR_PATH}`;
        const rendererUrl = `${appUrl}/build`;
        const isFileUrlInsideDirectory = loadIsFileUrlInsideDirectory({
            platform: 'win32',
            appPath: path.win32.join('C:\\Program Files', decodeURIComponent(APP_ASAR_PATH)),
        });

        it.each([
            ['the entry point', `${rendererUrl}/index.html`],
            ['a nested file', `${rendererUrl}/static/js/main.js`],
            ['a file with a query and a hash', `${rendererUrl}/index.html?debug=1#/settings`],
            ['a percent-encoded path', `${appUrl}/%62uild/index.html`],
            ['a file name starting with two dots', `${rendererUrl}/..assets/index.js`],
            ['a dot segment staying inside the directory', `${rendererUrl}/static/../index.html`],
            [
                'a path differing only in letter case',
                'file:///c:/program%20files/trezor%20suite/resources/app.asar/BUILD/index.html',
            ],
        ])('allows %s', (_description, fileUrl) => {
            expect(isFileUrlInsideDirectory(new URL(fileUrl))).toBe(true);
        });

        it.each([
            ['the directory itself', rendererUrl],
            ['the directory itself with a trailing slash', `${rendererUrl}/`],
            ['the parent directory', appUrl],
            ['a sibling sharing the directory name prefix', `${rendererUrl}-evil/index.html`],
            ['a sibling file in the parent directory', `${rendererUrl}/../package.json`],
            [
                'a dot segment escaping the directory',
                `${rendererUrl}/../../../../Windows/System32/drivers/etc/hosts`,
            ],
            [
                'an encoded dot segment escaping the directory',
                `${rendererUrl}/%2e%2e/%2e%2e/secret`,
            ],
            ['a different directory', 'file:///C:/Windows/System32/drivers/etc/hosts'],
            [
                'a percent-encoded different directory',
                'file:///C:/%57indows/System32/drivers/etc/hosts',
            ],
            ['the drive root', 'file:///C:/'],
            [
                'the same path on a different drive',
                `file:///D:/Program%20Files/${APP_ASAR_PATH}/build/index.html`,
            ],
            [
                'the same path on a network share',
                `file://server/share/Program%20Files/${APP_ASAR_PATH}/build/index.html`,
            ],
        ])('rejects %s', (_description, fileUrl) => {
            expect(isFileUrlInsideDirectory(new URL(fileUrl))).toBe(false);
        });

        it.each([
            ['an encoded backslash', `${rendererUrl}/static%5C..%5C..%5Cindex.html`],
            ['an encoded slash', `${rendererUrl}/static%2F..%2F..%2Findex.html`],
            [
                'a path without a drive letter',
                `file:///Program%20Files/${APP_ASAR_PATH}/build/index.html`,
            ],
            [
                'a different protocol',
                `https://example.com/C:/Program%20Files/${APP_ASAR_PATH}/build/index.html`,
            ],
        ])('rejects a URL that cannot be converted to a path: %s', (_description, fileUrl) => {
            expect(isFileUrlInsideDirectory(new URL(fileUrl))).toBe(false);
        });
    });
});
