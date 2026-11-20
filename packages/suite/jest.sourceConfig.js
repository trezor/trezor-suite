const path = require('path');

/**
 * Jest settings required to load @trezor/suite source code.
 *
 * Used by @trezor/suite's own Jest config and by any package whose tests render @trezor/suite
 * components (e.g. @suite-app/app). Those packages import this file as
 * `@trezor/suite/jest.sourceConfig` instead of copying the settings or pointing at
 * `packages/suite` paths.
 *
 * Why it is needed:
 * @trezor/suite source cannot be loaded by a plain Jest config. Its modules depend on build-time
 * conventions that only this package's tooling knows about, so every test that renders its
 * components needs the settings below, no matter which package the test lives in.
 *
 * Imports of the package's own modules (`#src/...`) need no setting here. They are subpath
 * imports declared in the `imports` field of package.json, which Jest resolves on its own.
 *
 * 1. Media asset imports.
 *    Components import SVG, WebP and MP4 files directly. Jest cannot parse them, so they map to
 *    stub modules.
 *
 * 2. A browser-like environment.
 *    Components render into a DOM (jsdom), Lottie animations draw on a canvas that jsdom does
 *    not implement (jest-canvas-mock), and jest.setup.js adds the remaining browser APIs and
 *    polyfills the components expect.
 *
 * 3. The Suite version.
 *    Firmware checks in rendered components compare against `process.env.VERSION`, which the
 *    app build sets from `suiteVersion`.
 *
 * All paths are resolved from this file, so the settings work from any package's Jest config.
 */
process.env.VERSION = require('./package.json').suiteVersion;

module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: [require.resolve('jest-canvas-mock')],
    setupFilesAfterEnv: [path.join(__dirname, 'jest.setup.js')],
    moduleNameMapper: {
        '\\.(mp4)$': path.join(__dirname, '__mocks__/import-mp4.js'),
        '\\.(svg|webp)$': path.join(__dirname, '__mocks__/import-svg.js'),
    },
};
