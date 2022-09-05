const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const glob = require('glob');
const { build } = require('esbuild');
const pkg = require('../package.json');
// @ts-expect-error
const { suiteVersion } = require('../../suite/package.json');

const { NODE_ENV, USE_MOCKS, IS_CODESIGN_BUILD } = process.env;
const PROJECT = 'desktop';

const source = path.join(__dirname, '..', 'src');
const isDev = NODE_ENV !== 'production';
const useMocks = USE_MOCKS === 'true' || (isDev && USE_MOCKS !== 'false');

// Get git revision
const gitRevision = childProcess.execSync('git rev-parse HEAD').toString().trim();

/**
 * Assemble release name for Sentry
 * Same definition is in packages/suite-build/configs/base.webpack.config.ts,
 * but reusing is not straightforward because this is JS script run by Node during build.
 */
const sentryRelease = `${suiteVersion}.${PROJECT}${
    IS_CODESIGN_BUILD === 'true' ? '.codesign' : ''
}.${gitRevision}`;

// Get all modules (used as entry points)
const modulePath = path.join(source, 'modules');
const modules = glob.sync(`${modulePath}/**/*.ts`).map(m => `modules${m.replace(modulePath, '')}`);

// Prepare mock plugin with files from the mocks folder
const mockPath = path.join(source, 'mocks');
const mocks = glob
    .sync(`${mockPath}/**/*.ts`)
    .map(m => m.replace(`${mockPath}/`, '').replace('.ts', ''));
const mockFilter = new RegExp(`^${mocks.join('|')}$`);
const mockPlugin = {
    name: 'mock-plugin',
    setup: build => {
        build.onResolve({ filter: mockFilter }, args => ({
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

// All local packages that doesn't have "build:libs" and used in packages/suite-desktop/src
// must be built and not included in electron node_modules, because they are in TS.
// Normal src/ folder is fine, because it's builded by webpack.
const builtTrezorDependencies = ['@trezor/ipc-proxy', '@trezor/urls', '@trezor/utils'];

const dependencies = Object.keys(pkg.dependencies).filter(
    name => !(name.startsWith('@suite-common/') || builtTrezorDependencies.includes(name)),
);
const devDependencies = Object.keys(pkg.devDependencies);

const electronExternalDependencies = [...dependencies, ...devDependencies];

// TODO: maybe desktop-api could be built too?

build({
    entryPoints: ['app.ts', 'preload.ts', ...modules].map(f => path.join(source, f)),
    platform: 'node',
    bundle: true,
    target: 'node16.13.2', // Electron 18
    external: electronExternalDependencies,
    tsconfig: path.join(source, 'tsconfig.json'),
    sourcemap: isDev,
    minify: !isDev,
    outdir: path.join(__dirname, '..', 'dist'),
    define: {
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'process.env.COMMITHASH': JSON.stringify(gitRevision),
        'process.env.APP_PUBKEY': JSON.stringify(appKey),
        'process.env.PROTOCOLS': JSON.stringify(pkg.build.protocols.schemes),
        'process.env.PKGNAME': JSON.stringify(pkg.name),
        'process.env.VERSION': JSON.stringify(suiteVersion),
        'process.env.SENTRY_RELEASE': JSON.stringify(sentryRelease),
        'process.env.SUITE_TYPE': JSON.stringify(PROJECT),
    },
    inject: [path.join(__dirname, 'build-inject.js')],
    plugins: useMocks ? [mockPlugin] : [],
})
    .then(() => {
        const hrend = process.hrtime(hrstart);
        console.log(
            '[Electron Build] Finished in %dms',
            (hrend[1] / 1000000 + hrend[0] * 1000).toFixed(1),
        );
    })
    .catch(() => process.exit(1));
