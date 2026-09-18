// Resolves and hashes everything generate.js derives the build from, so generate.test.ts can
// verify the committed build without running Binaryen.
/* eslint-disable import/no-extraneous-dependencies -- Build tooling, not runtime dependencies. */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { findCoinSelectionExports } from './coinSelectionExports.js';

export const getSha256 = buffer => createHash('sha256').update(buffer).digest('hex');

// Metro rejects this dynamic require outside node_modules. It is wasm-bindgen's Node fallback for
// `crypto`, never reached because the runtime provides `crypto.getRandomValues`.
const DYNAMIC_REQUIRE =
    /(export function __wbg_require_[0-9a-f]+\(arg0, arg1\) \{\n) {4}const ret = require\(getStringFromWasm0\(arg0, arg1\)\);\n {4}return addHeapObject\(ret\);\n\}/g;

const patchGlue = source => {
    const occurrences = source.match(DYNAMIC_REQUIRE)?.length ?? 0;
    if (occurrences !== 1) {
        throw new Error(
            `csl-asmjs: expected exactly one dynamic require in the glue, found ${occurrences}`,
        );
    }

    return source.replace(
        DYNAMIC_REQUIRE,
        '$1    throw new Error(`Dynamic require is not supported: ${getStringFromWasm0(arg0, arg1)}`);\n}',
    );
};

const SCRIPT_FILES = ['generate.js', 'inputs.js', 'coinSelectionExports.js'];

// `require` is passed in because the callers differ: generate.js is an ES module and the test runs
// under Jest's CommonJS require.
export const readInputs = (scriptDir, require) => {
    const wasmBytes = fs.readFileSync(
        require.resolve('@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib_bg.wasm'),
    );
    const glueDir = path.dirname(
        require.resolve('@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib_bg.js'),
    );
    const keepListPath = path.join(scriptDir, 'keep-list.json');
    const keepList = JSON.parse(fs.readFileSync(keepListPath, 'utf8'));
    const coinSelectionLibDir = path.join(
        path.dirname(require.resolve('@fivebinaries/coin-selection/package.json')),
        'lib/cjs',
    );
    const referencedExports = findCoinSelectionExports(coinSelectionLibDir);
    const glueSource = patchGlue(
        fs.readFileSync(path.join(glueDir, 'cardano_serialization_lib_bg.js'), 'utf8'),
    );
    const entrySource = fs.readFileSync(path.join(glueDir, 'cardano_serialization_lib.js'));
    const binaryenVersion = require('binaryen/package.json').version;

    const inputsHash = getSha256(
        [
            getSha256(wasmBytes),
            getSha256(fs.readFileSync(keepListPath)),
            getSha256(glueSource),
            getSha256(entrySource),
            ...SCRIPT_FILES.map(file => getSha256(fs.readFileSync(path.join(scriptDir, file)))),
            referencedExports.join('\n'),
            binaryenVersion,
        ].join('\n'),
    );

    return {
        wasmBytes,
        keepList,
        referencedExports,
        glueSource,
        entrySource,
        binaryenVersion,
        inputsHash,
    };
};
