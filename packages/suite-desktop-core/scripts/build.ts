/* eslint-disable no-console, @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';
import { sync } from 'glob';
import { build, PluginBuild } from 'esbuild';

const uriSchemes = require('../../suite-desktop/uriSchemes.json');
const pkg = require('../../suite-desktop/package.json');
const { suiteVersion } = require('../../suite/package.json');

const { NODE_ENV, USE_MOCKS, IS_CODESIGN_BUILD } = process.env;
const PROJECT = 'desktop';

const source = path.join(__dirname, '..', 'src');
const isDev = NODE_ENV !== 'production';
const isCodesignBuild = IS_CODESIGN_BUILD === 'true';
const useMocks = USE_MOCKS === 'true' || (isDev && USE_MOCKS !== 'false');

// Get git revision
const gitRevision = childProcess.execSync('git rev-parse HEAD').toString().trim();

/**
 * Assemble release name for Sentry
 * Same definition is in packages/suite-build/configs/base.webpack.config.ts,
 * but reusing is not straightforward because this is JS script run by Node during build.
 */
const sentryRelease = `${suiteVersion}.${PROJECT}${
    isCodesignBuild ? '.codesign' : ''
}.${gitRevision}`;

const threadPath = path.join(source, 'threads');
const threads = sync(`${threadPath}/**/*.ts`).map(u => `threads${u.replace(threadPath, '')}`);

// Prepare mock plugin with files from the mocks folder
const mockPath = path.join(source, 'mocks');
const mocks = sync(`${mockPath}/**/*.ts`).map(m =>
    m.replace(`${mockPath}/`, '').replace('.ts', ''),
);
const mockFilter = new RegExp(`^${mocks.join('|')}$`);
const mockPlugin = {
    name: 'mock-plugin',
    setup: (setup: PluginBuild) => {
        setup.onResolve({ filter: mockFilter }, args => ({
            path: path.join(mockPath, `${args.path}.ts`),
        }));
    },
};

// Read signature public key
const keyPath = path.join(__dirname, 'app-key.asc');
const appKey = fs.readFileSync(keyPath, 'utf-8');

// Start build
const hrstart = process.hrtime();
console.log('[Electron Build] Starting...');
console.log(`[Electron Build] Mode: ${isDev ? 'development' : 'production'}`);
console.log(`[Electron Build] Using mocks: ${useMocks}`);

const dependencies = Object.keys(pkg.dependencies);
const devDependencies = Object.keys(pkg.devDependencies);

const electronExternalDependencies = [
    ...dependencies,
    ...devDependencies,
    '*/connect/trezor-connect',
];

build({
    entryPoints: ['app.ts', 'preload.ts', ...threads].map(f => path.join(source, f)),
    platform: 'node',
    bundle: true,
    target: 'node18.16.1', // Electron 26
    external: electronExternalDependencies,
    tsconfig: path.join(source, 'tsconfig.json'),
    sourcemap: isDev,
    minify: !isDev,
    outdir: path.join(__dirname, '../../suite-desktop', 'dist'),
    define: {
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'process.env.COMMITHASH': JSON.stringify(gitRevision),
        'process.env.APP_PUBKEY': JSON.stringify(appKey),
        'process.env.PROTOCOLS': JSON.stringify(uriSchemes),
        'process.env.VERSION': JSON.stringify(suiteVersion),
        'process.env.SENTRY_RELEASE': JSON.stringify(sentryRelease),
        'process.env.SUITE_TYPE': JSON.stringify(PROJECT),
        'process.env.IS_CODESIGN_BUILD': `"${isCodesignBuild}"`, // to keep it as string "true"/"false" and not boolean
    },
    inject: [path.join(__dirname, 'build-inject.ts')],
    plugins: useMocks ? [mockPlugin] : [],
    alias: {
        '@trezor/connect': './connect/trezor-connect',
    },
})
    .then(() => {
        const hrend = process.hrtime(hrstart);
        console.log(
            '[Electron Build] Finished in %dms',
            (hrend[1] / 1000000 + hrend[0] * 1000).toFixed(1),
        );
    })
    .catch(() => process.exit(1));
