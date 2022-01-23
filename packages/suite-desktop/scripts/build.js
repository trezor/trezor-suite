const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const glob = require('glob');
const { build } = require('esbuild');
const pkg = require('../package.json');
const { suiteVersion } = require('../../suite/package.json');

const { NODE_ENV, USE_MOCKS } = process.env;

const electronSource = path.join(__dirname, '..', 'src-electron');
const isDev = NODE_ENV !== 'production';
const useMocks = USE_MOCKS === 'true' || (isDev && USE_MOCKS !== 'false');

// Get git revision
const gitRevision = childProcess.execSync('git rev-parse HEAD').toString().trim();

// Get all modules (used as entry points)
const modulePath = path.join(electronSource, 'modules');
const modules = glob.sync(`${modulePath}/**/*.ts`).map(m => `modules${m.replace(modulePath, '')}`);

// Prepare mock plugin with files from the mocks folder
const mockPath = path.join(electronSource, 'mocks');
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

build({
    entryPoints: ['app.ts', 'preload.ts', ...modules].map(f => path.join(electronSource, f)),
    platform: 'node',
    bundle: true,
    target: 'node16.5.0', // Electron 15
    external: Object.keys({
        ...pkg.dependencies,
        ...pkg.devDependencies,
    }),
    tsconfig: path.join(electronSource, 'tsconfig.json'),
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
