import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import { isCodesignBuild, isTestBuild } from '../utils/env';
import { getPathForProject } from '../utils/path';

// The Tauri shell reuses the desktop frontend (suite-desktop-ui) but boots through a Tauri-specific
// entry (indexTauri.tsx → MainTauri.tsx) that talks to the local Bridge via connect-web instead of
// an Electron main-process IPC proxy. Everything below the frontend is provided by the Tauri Rust
// backend (window.desktopApi, injected as a WebView initialization script).

const baseDirUI = getPathForProject('desktop-ui');
const baseDir = getPathForProject('tauri');

const messageSystemFile = path.join(
    __dirname,
    '../../../',
    'suite-common',
    'message-system',
    'files',
    'config.v1.ts',
);
const messageSystemMockFile = path.join(
    __dirname,
    '../../../',
    'suite-common',
    'message-system',
    'build-mock',
    'config.v1.ts',
);

const config: webpack.Configuration = {
    // WKWebView (macOS) / WebView2 (Windows) / WebKitGTK (Linux) — target a modern baseline.
    target: 'browserslist:Chrome >= 120, Safari >= 16',
    // Override the base 'source-map': Tauri embeds the WHOLE frontendDist into the binary, so
    // shipping ~77MB of .map files would bloat (and leak source into) the distributed binary. CI
    // should upload sourcemaps to Sentry from a separate map-emitting build if symbolication is
    // needed; the shipped binary carries none.
    devtool: false,
    entry: {
        main: [path.join(baseDirUI, 'src', 'indexTauri.tsx')],
        // Web-style transport uses a SharedWorker for device sessions (like the web build).
        'sessions-background-sharedworker': {
            filename: 'js/workers/[name].js',
            import: path.resolve(
                __dirname,
                '../../transport-web/src/sessions/background-sharedworker.ts',
            ),
            chunkLoading: 'import-scripts',
        },
        // connect-web popup core bootstrap (used when connect opens its popup).
        'connect-popup-bootstrap': {
            filename: 'connect-popup/bootstrap.[hash].js',
            import: path.resolve(__dirname, '../../connect-web/src/bootstrap/index.ts'),
        },
    },
    output: {
        path: path.join(baseDir, 'build'),
        publicPath: 'auto',
    },
    resolve: {
        // No `@trezor/connect` alias (unlike the Electron desktop build, which maps it to
        // connect-electron/ipc-proxy). The Tauri webview has no Node main process, so — exactly
        // like the web build — it uses `@trezor/connect` directly, resolved via its package.json
        // `browser` field to the browser build (`index.browser.ts`), which runs connect in-webview
        // and re-exports the full API (PROTO, method types, …).
        alias: {
            ...(isTestBuild ? { [messageSystemFile]: messageSystemMockFile } : {}),
        },
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                // NOTE: unlike the Electron desktop build we deliberately do NOT copy suite-data's
                // `bin` dir. It contains the tor / coinjoin / bluetooth / udev / win_hello binaries
                // for ALL platforms (~250MB) — but the Tauri webview needs none of them: tor and
                // bluetooth run as native Rust sidecars (bundled as Tauri resources for the current
                // platform only), coinjoin is not used, and udev/win_hello are Electron-native. The
                // only binaries the webview fetches are firmware (copied separately below). Embedding
                // the whole `bin` dir into the Tauri binary bloated it by ~150MB.
                ...['fonts', 'images', 'videos', 'guide/assets'].map(dir => ({
                    from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                    to: path.join(baseDir, 'build', 'static', dir),
                })),
                {
                    from: messageSystemFile,
                    to: path.join(baseDir, 'build', 'static', 'message-system'),
                },
                // include FW binaries from @trezor/connect-common
                {
                    from: path.join(__dirname, '../../', 'connect-data/files/firmware'),
                    to: path.join(baseDir, 'build/static/bin/firmware'),
                },
                // devkit (developer-kit) firmware must NOT ship in official codesigned releases
                // (parity with desktop.webpack.config.ts)
                ...(isCodesignBuild
                    ? []
                    : [
                          {
                              from: path.join(
                                  __dirname,
                                  '../../',
                                  'connect-data/files/devkit/firmware',
                              ),
                              to: path.join(baseDir, 'build/static/bin/devkit/firmware'),
                          },
                      ]),
                // release notes for the post-update "Just updated" modal (JustUpdated.tsx fetches
                // /release-notes.md); without this the fetch 404s and renders the SPA fallback HTML
                {
                    from: path.join(__dirname, '../../', 'suite-desktop/releaseNotes'),
                    to: path.join(baseDir, 'build'),
                },
                {
                    from: path.join(
                        path.dirname(require.resolve('@suite-common/flags/package.json')),
                        'assets',
                        'flags',
                    ),
                    to: path.join(baseDir, 'build', 'static', 'flags'),
                },
            ],
            options: {
                concurrency: 100,
            },
        }),
        new HtmlWebpackPlugin({
            chunks: ['main'],
            minify: false,
            template: path.join(baseDirUI, 'src', 'static', 'index.html'),
            templateParameters: {
                // Served over http(s) in dev (localhost:8000) and via tauri://localhost in a bundle;
                // absolute-from-root asset paths work in both.
                assetPrefix: '',
                isOnionLocation: false,
            },
            filename: path.join(baseDir, 'build', 'index.html'),
        }),
        new HtmlWebpackPlugin({
            chunks: ['connect-popup-bootstrap'],
            minify: false,
            templateParameters: {
                assetPrefix: '',
                isOnionLocation: false,
            },
            inject: 'body' as const,
            scriptLoading: 'blocking' as const,
            template: path.resolve(__dirname, '../../connect-web/src/bootstrap/bootstrap.html'),
            filename: path.join(baseDir, 'build/connect-popup/bootstrap.html'),
        }),
    ],
};

export default config;
