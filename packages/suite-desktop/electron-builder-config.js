const { suiteVersion } = require('../suite/package.json');
const schemes = require('./uriSchemes.json');

const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';

/* eslint-disable no-template-curly-in-string */ // to be able to use patterns like ${author} and ${arch}
module.exports = {
    // distingush between dev and prod builds
    appId: `io.trezor.TrezorSuite${isCodesignBuild ? '' : '.dev'}`,
    extraMetadata: {
        version: suiteVersion,
        // distingush between dev and prod builds so different userDataDir is used
        name: `@trezor/suite-desktop${isCodesignBuild ? '' : '-dev'}`,
    },
    productName: 'Trezor Suite',
    copyright: 'Copyright © ${author}',
    asar: true,
    directories: {
        output: 'build-electron',
    },
    files: [
        'build/**/*',
        '!build/**/*.js.map',
        'dist/**/*.js',
        'package.json',
        '!build/static/**/{favicon,icons,bin,browsers}',
        '!bin/firmware',
        '!node_modules/@suite-common',
        '!node_modules/@trezor/**/{src,coverage,build,scripts,webpack,integration,e2e,libDev}',
        '!node_modules/@trezor/connect-common/**/*.bin',
        '!node_modules/@babel',
        '!node_modules/date-fns',
        '!node_modules/@reduxjs',
        '!node_modules/react-native-config',
        '!node_modules/redux',
        '!node_modules/redux-thunk',
        '!node_modules/reselect',
        '!node_modules/prettier',
        '!node_modules/regenerator-runtime',
        '!node_modules/ajv/lib',
        '!node_modules/ripple-lib/build',
        '!node_modules/openpgp',
        'node_modules/openpgp/package.json',
        'node_modules/openpgp/dist/node',
        '!node_modules/@sentry/**/esm',
        '!node_modules/@sentry/**/build',
        '!node_modules/tiny-secp256k1/**/build',
        '!node_modules/blake-hash/**/build',
        '!node_modules/bcrypto/**/build',
        '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
        '!**/node_modules/*.d.ts',
        '!**/node_modules/.bin',
        '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
        '!.editorconfig',
        '!**/._*',
        '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes,docs,LICENCE}',
        '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
        '!**/{appveyor.yml,.travis.yml,circle.yml}',
        '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}',
        '!**/node_modules/**/*.js.flow',
        '!**/node_modules/**/*.ts',
        '!**/node_modules/**/.*',
        '!**/{jest,babel,bower,tsconfig}*',
        '!**/*.log',
        '!**/*.d.ts.map',
        '!**/docs',
        '!**/*.md',
    ],
    extraResources: [
        {
            from: 'build/static/images/desktop/512x512.png',
            to: 'images/desktop/512x512.png',
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
        provider: 'github',
        repo: 'trezor-suite',
        owner: 'trezor',
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
                from: 'build/static/bin/bridge/mac-${arch}',
                to: 'bin/bridge',
            },
            {
                from: 'build/static/bin/tor/mac-${arch}',
                to: 'bin/tor',
            },
            {
                from: 'build/static/bin/coinjoin/mac-${arch}',
                to: 'bin/coinjoin',
            },
        ],
        icon: 'build/static/images/desktop/512x512.icns',
        artifactName: 'Trezor-Suite-${version}-mac-${arch}.${ext}',
        hardenedRuntime: true,
        gatekeeperAssess: false,
        darkModeSupport: true,
        entitlements: 'entitlements.mac.inherit.plist',
        entitlementsInherit: 'entitlements.mac.inherit.plist',
        target: ['dmg', 'zip'],
    },
    win: {
        extraResources: [
            {
                from: 'build/static/bin/bridge/win-${arch}',
                to: 'bin/bridge',
            },
            {
                from: 'build/static/bin/tor/win-${arch}',
                to: 'bin/tor',
            },
            {
                from: 'build/static/bin/coinjoin/win-${arch}',
                to: 'bin/coinjoin',
            },
        ],
        icon: 'build/static/images/desktop/512x512.png',
        artifactName: 'Trezor-Suite-${version}-win-${arch}.${ext}',
        target: ['nsis'],
        signDlls: true,
    },
    linux: {
        extraResources: [
            {
                from: 'build/static/bin/bridge/linux-${arch}',
                to: 'bin/bridge',
            },
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
        ],
        icon: 'build/static/images/desktop/512x512.png',
        artifactName: 'Trezor-Suite-${version}-linux-${arch}.${ext}',
        executableName: 'trezor-suite',
        category: 'Utility',
        target: ['AppImage'],
    },
    afterSign: 'scripts/notarize.ts',
};
