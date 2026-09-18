// Builds generated/csl-asmjs/ (committed, Git LFS): Emurgo's CSL WASM pruned to the exports
// coin-selection references and the traced keep-list.json, translated to asm.js for Hermes.
// See README.md.
/* eslint-disable import/no-extraneous-dependencies -- Build tooling, not runtime dependencies. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getSha256, readInputs } from './inputs.js';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, '../../generated/csl-asmjs');

const {
    wasmBytes,
    keepList,
    referencedExports,
    glueSource,
    entrySource,
    binaryenVersion,
    inputsHash,
} = readInputs(scriptDir, require);

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

// wasm-bindgen exports `__wbg_<class>_free` per class and `<class>_<method>` per method.
const classNames = exportNames
    .map(exportName => exportName.match(/^__wbg_([a-z0-9]+)_free$/)?.[1])
    .filter(Boolean);
const getClassOf = exportName =>
    classNames.find(
        className =>
            exportName.startsWith(`${className}_`) || exportName.startsWith(`__wbg_${className}_`),
    );

const usedExports = new Set([...keepList.usedExports, ...referencedExports]);
const usedClasses = new Set([...usedExports].map(getClassOf).filter(Boolean));

const isKept = exportName => {
    if (exportName === 'memory' || exportName.startsWith('__wbindgen')) return true;
    // The glue registers a FinalizationRegistry for every class at load, used or not.
    if (/^__wbg_[a-z0-9]+_free$/.test(exportName)) return true;
    if (usedExports.has(exportName)) return true;

    // Whole classes, so an untraced code path within a used class cannot hit a missing method.
    return usedClasses.has(getClassOf(exportName));
};

const keptExports = exportNames.filter(isKept);
exportNames.filter(name => !isKept(name)).forEach(name => wasmModule.removeExport(name));

wasmModule.runPasses(['remove-unused-module-elements', 'dce', 'remove-unused-module-elements']);

// emitAsmjs rewrites the module, so measure first.
const prunedWasmSize = wasmModule.emitBinary().length;
const functionCount = wasmModule.getNumFunctions();
const asmJs = wasmModule.emitAsmjs();
wasmModule.dispose();

const missingExports = keptExports.filter(name => !asmJs.includes(`export var ${name} =`));
if (missingExports.length > 0) {
    throw new Error(`csl-asmjs: kept exports missing from output: ${missingExports.join(', ')}`);
}

const outputs = {
    'cardano_serialization_lib.asm.js': asmJs,
    'cardano_serialization_lib_bg.js': glueSource,
    'cardano_serialization_lib.js': entrySource,
};

fs.mkdirSync(outputDir, { recursive: true });
Object.entries(outputs).forEach(([file, content]) =>
    fs.writeFileSync(path.join(outputDir, file), content),
);
fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
        {
            inputsHash,
            outputHashes: Object.fromEntries(
                Object.entries(outputs).map(([file, content]) => [file, getSha256(content)]),
            ),
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
