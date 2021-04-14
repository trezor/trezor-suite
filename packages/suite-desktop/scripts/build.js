const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const glob = require('glob');
const { build } = require('esbuild');
const pkg = require('../package.json');

const { NODE_ENV, USE_MOCKS } = process.env;

const electronSource = path.join(__dirname, '..', 'src-electron');
const isDev = NODE_ENV !== 'production';
const useMocks = USE_MOCKS === 'true' || (isDev && USE_MOCKS !== 'false');

const gitRevision = child_process.execSync('git rev-parse HEAD').toString().trim();
const modulePath = path.join(electronSource, 'modules');
const modules = glob.sync(`${modulePath}/**/*.ts`).map(m => `modules${m.replace(modulePath, '')}`);

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

console.log('[Electron Build] Starting...');
const hrstart = process.hrtime();
build({
    entryPoints: ['app.ts', 'preload.ts', ...modules].map(f => path.join(electronSource, f)),
    platform: 'node',
    bundle: true,
    target: 'node14.16.0', // Electron 12
    external: Object.keys({
        ...pkg.dependencies,
        ...pkg.devDependencies,
    }),
    tsconfig: path.join(electronSource, 'tsconfig.json'),
    sourcemap: isDev,
    minify: !isDev,
    outdir: path.join(__dirname, '..', 'dist'),
    define: {
        'process.env.COMMITHASH': JSON.stringify(gitRevision),
    },
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
