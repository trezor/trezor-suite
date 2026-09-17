// Generates a pure-JS (asm.js) build of Cardano Serialization Lib for platforms without WebAssembly
// (Hermes on mobile), reduced to the parts @fivebinaries/coin-selection uses.
//
// Input: the WASM binary published by Emurgo, the JS glue from Emurgo's own asm.js package, and
// keep-list.json (produced by trace.js). Output: generated/csl-asmjs/, committed with the large files
// in Git LFS so that installs and builds do not run Binaryen. Run it after changing any input; the
// run is skipped when the manifest shows that none of the inputs changed, and generate.test.ts fails
// when the committed output is stale.
/* eslint-disable import/no-extraneous-dependencies -- Build tooling of this script, not runtime dependencies of the package. */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir =
    process.env.CSL_ASMJS_OUTPUT_DIR ?? path.resolve(scriptDir, '../../generated/csl-asmjs');
const keepListPath = path.join(scriptDir, 'keep-list.json');

const wasmPath =
    require.resolve('@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib_bg.wasm');
const glueDir = path.dirname(
    require.resolve('@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib_bg.js'),
);
const binaryenVersion = require('binaryen/package.json').version;

const getSha256 = buffer => createHash('sha256').update(buffer).digest('hex');

// The wasm-bindgen Node fallback for `require('crypto')`. Metro rejects a dynamic require in
// project files (it only tolerates it inside node_modules, as a runtime throw), and the fallback
// is never reached because the runtime provides `crypto.getRandomValues`. Mirror Metro's
// node_modules behaviour by throwing at runtime.
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

const wasmBytes = fs.readFileSync(wasmPath);
const keepList = JSON.parse(fs.readFileSync(keepListPath, 'utf8'));
const glueSource = patchGlue(
    fs.readFileSync(path.join(glueDir, 'cardano_serialization_lib_bg.js'), 'utf8'),
);
const entrySource = fs.readFileSync(path.join(glueDir, 'cardano_serialization_lib.js'));

const inputsHash = getSha256(
    [
        getSha256(wasmBytes),
        getSha256(fs.readFileSync(keepListPath)),
        getSha256(glueSource),
        getSha256(entrySource),
        getSha256(fs.readFileSync(fileURLToPath(import.meta.url))),
        binaryenVersion,
    ].join('\n'),
);

const manifestPath = path.join(outputDir, 'manifest.json');
const existingManifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : undefined;

if (existingManifest?.inputsHash === inputsHash) {
    console.log('csl-asmjs: up to date');
    process.exit(0);
}

const binaryen = (await import('binaryen')).default;

const wasmModule = binaryen.readBinary(wasmBytes);
const exportNames = [];
for (let index = 0; index < wasmModule.getNumExports(); index++) {
    exportNames.push(binaryen.getExportInfo(wasmModule.getExportByIndex(index)).name);
}

// The wasm-bindgen naming: `__wbg_<class>_free` per class, `<class>_<method>` per method and a bare
// `<function>` for free functions. The free exports identify the classes exactly.
const classNames = exportNames
    .map(exportName => exportName.match(/^__wbg_([a-z0-9]+)_free$/)?.[1])
    .filter(Boolean);
const getClassOf = exportName =>
    classNames.find(
        className =>
            exportName.startsWith(`${className}_`) || exportName.startsWith(`__wbg_${className}_`),
    );

const usedExports = new Set(keepList.usedExports);
const usedClasses = new Set([...usedExports].map(getClassOf).filter(Boolean));

const isKept = exportName => {
    // Runtime plumbing used by the glue: memory, allocator, stack pointer, closure tables.
    if (exportName === 'memory' || exportName.startsWith('__wbindgen')) return true;
    // The glue registers a FinalizationRegistry for every class at load time, used or not.
    if (/^__wbg_[a-z0-9]+_free$/.test(exportName)) return true;
    if (usedExports.has(exportName)) return true;

    // Every method of a traced class is kept, so a code path the trace did not reach cannot hit a
    // missing function within a class Suite already uses.
    return usedClasses.has(getClassOf(exportName));
};

const keptExports = exportNames.filter(isKept);
exportNames.filter(name => !isKept(name)).forEach(name => wasmModule.removeExport(name));

// Dropping the exports makes their functions unreachable; the passes delete them transitively.
wasmModule.runPasses(['remove-unused-module-elements', 'dce', 'remove-unused-module-elements']);

// Measured before emitAsmjs, which rewrites the module for the JavaScript target.
const prunedWasmSize = wasmModule.emitBinary().length;
const functionCount = wasmModule.getNumFunctions();
const asmJs = wasmModule.emitAsmjs();
wasmModule.dispose();

const missingExports = keptExports.filter(name => !asmJs.includes(`export var ${name} =`));
if (missingExports.length > 0) {
    throw new Error(`csl-asmjs: kept exports missing from output: ${missingExports.join(', ')}`);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'cardano_serialization_lib.asm.js'), asmJs);
fs.writeFileSync(path.join(outputDir, 'cardano_serialization_lib_bg.js'), glueSource);
fs.writeFileSync(path.join(outputDir, 'cardano_serialization_lib.js'), entrySource);
fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
        {
            inputsHash,
            binaryenVersion,
            exportsKept: keptExports.length,
            exportsTotal: exportNames.length,
            functions: functionCount,
            wasmBytes: { original: wasmBytes.length, pruned: prunedWasmSize },
            asmJsBytes: asmJs.length,
        },
        null,
        4,
    )}\n`,
);

console.log(
    `csl-asmjs: kept ${keptExports.length}/${exportNames.length} exports, ` +
        `${functionCount} functions, asm.js ${(asmJs.length / 1e6).toFixed(1)} MB`,
);
