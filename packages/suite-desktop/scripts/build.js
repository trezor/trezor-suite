const path = require('path');
const { build } = require('esbuild');
const pkg = require('../package.json');

const electronSource = path.join(__dirname, '..', 'src-electron');
const isDev = process.env.NODE_ENV !== 'production';

console.log('[Electron Build] Starting...');
const hrstart = process.hrtime();
build({
    entryPoints: ['app', 'preload'].map(f => path.join(electronSource, `${f}.ts`)),
    platform: 'node',
    bundle: true,
    target: 'node12.18.2', // Electron 11
    external: Object.keys({
        ...pkg.dependencies,
        ...pkg.devDependencies,
    }),
    tsconfig: path.join(electronSource, 'tsconfig.json'),
    sourcemap: isDev,
    minify: !isDev,
    outdir: path.join(__dirname, '..', 'dist'),
})
    .then(() => {
        const hrend = process.hrtime(hrstart);
        console.log(
            '[Electron Build] Finished in %dms',
            (hrend[1] / 1000000 + hrend[0] * 1000).toFixed(1),
        );
    })
    .catch(() => process.exit(1));
