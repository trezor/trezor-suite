const schemes = require('./uriSchemes.json');
const { suiteVersion } = require('../suite/package.json');

const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';

// to be able to use patterns like ${author} and ${arch}
module.exports = {
    // distinguish between dev and prod builds
    appId: `io.trezor.TrezorSuite${isCodesignBuild ? '' : '.dev'}`,
    extraMetadata: {
        version: suiteVersion,
        // distinguish between dev and prod builds so different userDataDir is used
        name: `@trezor/suite-desktop${isCodesignBuild ? '' : '-dev'}`,
    },
    productName: 'Trezor Suite',
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
        '!node_modules/blake-hash/**/{build,src}', // exclude files unnecessary for runtime
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
        name: 'Trezor Suite',
        schemes,
    },
    publish: {
        provider: 'generic',
        url: 'https://data.trezor.io/suite/releases/desktop/latest',
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
        artifactName: 'Trezor-Suite-${version}-mac-${arch}.${ext}',
        hardenedRuntime: isCodesignBuild,
        gatekeeperAssess: false,
        darkModeSupport: true,
        entitlements: 'entitlements.mac.inherit.plist',
        entitlementsInherit: 'entitlements.mac.inherit.plist',
        extendInfo: {
            NSBluetoothAlwaysUsageDescription:
                'Allow Trezor Suite to use Bluetooth to securely connect and communicate with your Trezor device.',
            // Delete those keys from Info.plist, Electron adds them by default but Trezor Suite does not need these permissions
            NSMicrophoneUsageDescription: undefined,
            // Replace default "This app needs access to the camera" message with our own
            NSCameraUsageDescription:
                'Allow Trezor Suite to access the camera to scan QR codes? Or enter the address manually.',
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
        artifactName: 'Trezor-Suite-${version}-win-${arch}.${ext}',
        target: ['nsis'],
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
        artifactName: 'Trezor-Suite-${version}-linux-${arch}.${ext}',
        executableName: 'trezor-suite',
        category: 'Utility',
        target: ['AppImage', 'snap'],
        description:
            'Trezor Suite is a comprehensive app for securely managing cryptocurrency\nwith your Trezor device. It allows you to send, receive, and track digital\nassets.  Key features include explicit transaction confirmation on your\nTrezor hardware wallet, passphrase wallets for enhanced privacy, coin\ncontrol, staking rewards, and support for a wide range of coins and tokens.\nIt also integrates security features like Tor for private browsing and\nTaproot for enhanced Bitcoin privacy.\n\nFor the Trezor device to be detected, you need to have systemd 256.4 or\nnewer, or install udev rules on your system from the Trezor website.\n',
    },
    snap: {
        base: 'core22',
        allowNativeWayland: true,
        plugs: ['default', 'raw-usb', 'bluez', 'camera'],
        stagePackages: ['default', 'libpcre3', 'libtinfo5'],
    },
    // TODO #14482: when Electron-main is migrated to ESM, and we declare whole suite-desktop package as ESM, rename .mjs files to .js
    afterPack: '../suite-desktop-core/scripts/setElectronFuses.mjs',
    afterSign: '../suite-desktop-core/scripts/notarize.mjs',
};
