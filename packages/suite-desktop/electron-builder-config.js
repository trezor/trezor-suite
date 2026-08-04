const schemes = require('./uriSchemes.json');
const { suiteVersion } = require('../suite/package.json');

const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';

// to be able to use patterns like ${author} and ${arch}
module.exports = {
    // distinguish between dev and prod builds
    appId: `io.suitedark.app${isCodesignBuild ? '' : '.dev'}`,
    extraMetadata: {
        // Suite Dark flavour: CI stamps FLAVOUR_VERSION (e.g. 26.8.0-suitedark.<run>) so the
        // auto-updater sees a monotonically increasing version; falls back to suiteVersion locally.
        version: process.env.FLAVOUR_VERSION || suiteVersion,
        // distinguish between dev and prod builds so different userDataDir is used
        name: `suitedark-desktop${isCodesignBuild ? '' : '-dev'}`,
    },
    productName: 'Suite Dark',
    copyright: 'Copyright © ${author}',
    asar: true,
    asarUnpack: ['**/*.node'],
    directories: {
        output: 'build-electron',
    },
    npmRebuild: false,
    files: [
        // defaults are https://www.electron.build/configuration#files
        'build/**/*', // Electron renderer process
        'dist/**/*.{js,wasm}', // Electron main+preload process
        '!**/*.{md,js.map}', // exclude files unnecessary for runtime
        'build/release-notes.md', // this one is dynamically loaded in runtime
        '!build/static/**/{favicon,icons,bin,browsers}', // copied as extraResources instead, some are platform-specific
        '!node_modules/usb/**/{libusb,libusb_config,src}', // exclude files unnecessary for runtime
        '!node_modules/@trezor/**', // exclude @trezor/suite-desktop, which would recurse. Other @trezor packages are bundled by bundler.
    ],
    extraResources: [
        {
            from: 'build/static/images/desktop/512x512.png',
            to: 'images/desktop/512x512.png',
        },
        {
            from: 'build/static/images/favicons',
            to: 'images/favicons',
        },
        {
            from: 'build/static/bin/firmware',
            to: 'bin/firmware',
        },
        {
            from: 'build/static/bin/devkit',
            to: 'bin/devkit',
        },
    ],
    protocols: {
        name: 'Suite Dark',
        schemes,
    },
    publish: {
        provider: 'generic',
        // Suite Dark flavour: the "continuous" GitHub release hosts latest*.yml + installers.
        url: 'https://github.com/suite-dark/suite-dark/releases/download/continuous/',
        // Force the "latest" channel so the monotonic prerelease version
        // (e.g. 26.8.0-suitedark.<run>) still writes latest*.yml, not <tag>*.yml.
        channel: 'latest',
    },
    dmg: {
        sign: false,
        contents: [
            {
                x: 410,
                y: 150,
                type: 'link',
                path: '/Applications',
            },
            {
                x: 130,
                y: 150,
                type: 'file',
            },
        ],
        background: 'build/static/images/desktop/background.tiff',
    },
    nsis: {
        oneClick: false,
    },
    mac: {
        files: ['entitlements.mac.inherit.plist'],
        extraResources: [
            {
                from: 'build/static/bin/tor/mac-${arch}',
                to: 'bin/tor',
            },
            {
                from: 'build/static/bin/coinjoin/mac-${arch}',
                to: 'bin/coinjoin',
            },
            {
                from: 'build/static/bin/bluetooth/mac-${arch}',
                to: 'bin/bluetooth',
            },
        ],
        icon: 'build/static/images/desktop/512x512.icns',
        artifactName: 'SuiteDark-mac-${arch}.${ext}',
        identity: isCodesignBuild ? undefined : '-',
        hardenedRuntime: isCodesignBuild,
        gatekeeperAssess: false,
        darkModeSupport: true,
        entitlements: 'entitlements.mac.inherit.plist',
        entitlementsInherit: 'entitlements.mac.inherit.plist',
        extendInfo: {
            NSBluetoothAlwaysUsageDescription:
                'Allow Suite Dark to use Bluetooth to securely connect and communicate with your Trezor device.',
            // Delete those keys from Info.plist, Electron adds them by default but Trezor Suite does not need these permissions
            NSMicrophoneUsageDescription: undefined,
            // Replace default "This app needs access to the camera" message with our own
            NSCameraUsageDescription:
                'Allow Suite Dark to access the camera to scan QR codes? Or enter the address manually.',
        },
        target: ['dmg', 'zip'],
    },
    win: {
        extraResources: [
            {
                from: 'build/static/bin/tor/win-${arch}',
                to: 'bin/tor',
            },
            {
                from: 'build/static/bin/coinjoin/win-${arch}',
                to: 'bin/coinjoin',
            },
            {
                from: 'build/static/bin/win_hello.node',
                to: 'bin/win_hello.node',
            },
            {
                from: 'build/static/bin/bluetooth/win-${arch}',
                to: 'bin/bluetooth',
            },
        ],
        icon: 'build/static/images/desktop/512x512.png',
        artifactName: 'SuiteDark-win-${arch}.${ext}',
        target: ['nsis'],
        signExts: ['.exe', '.dll'],
        signtoolOptions: {
            publisherName: ['SatoshiLabs, s.r.o.', 'Trezor Company s.r.o.'],
            // TODO #14482: when Electron-main is migrated to ESM, and we declare whole suite-desktop package as ESM, rename .mjs files to .js
            sign: '../suite-desktop-core/scripts/sign-windows.mjs',
        },
    },
    linux: {
        extraResources: [
            {
                from: 'build/static/bin/tor/linux-${arch}',
                to: 'bin/tor',
            },
            {
                from: 'build/static/bin/udev',
                to: 'bin/udev',
            },
            {
                from: 'build/static/bin/coinjoin/linux-${arch}',
                to: 'bin/coinjoin',
            },
            {
                from: 'build/static/bin/bluetooth/linux-${arch}',
                to: 'bin/bluetooth',
            },
        ],
        icon: 'build/static/images/desktop/512x512.png',
        artifactName: 'SuiteDark-linux-${arch}.${ext}',
        executableName: 'suitedark',
        category: 'Utility',
        target: ['AppImage'],
    },
    // TODO #14482: when Electron-main is migrated to ESM, and we declare whole suite-desktop package as ESM, rename .mjs files to .js
    afterPack: '../suite-desktop-core/scripts/setElectronFuses.mjs',
    afterSign: '../suite-desktop-core/scripts/notarize.mjs',
};
