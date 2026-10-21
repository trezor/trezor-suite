// size-limit bundles the published entry with esbuild (browser target) and
// measures the gzipped result, so an accidentally bundled heavy dependency or
// a tree-shake regression shows up as a jump here. See issue #8771.
//
// connect-web ships a single build (./lib, exposed as ./lib/index.js by
// publishConfig). It is a thin dynamic-loader shim — the heavy @trezor/connect
// core runs out-of-process and is not bundled here.
//
// Baseline measured 2026-07-19 on develop: ~79 KB gzipped. limit = baseline
// + ~15% headroom. Bump it in the same PR as a legitimate size increase.

export default [
    {
        name: 'lib/index.js (gzipped, bundled)',
        path: 'lib/index.js',
        limit: '90 KB',
        gzip: true,
    },
];
