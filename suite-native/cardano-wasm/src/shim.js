/**
 * React Native replacement for @emurgo/cardano-serialization-lib-nodejs.
 *
 * The original nodejs variant loads a .wasm file via fs.readFileSync and
 * synchronously instantiates it. We do the same thing, just reading the
 * bytes from a base64-encoded JS module instead of the filesystem.
 *
 * The _bg.js glue code (39K lines of wasm-bindgen output) is imported
 * directly from node_modules — nothing is copied or re-implemented.
 */

const bg = require('@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib_bg.js');

const base64 = require('./generated/cardanoWasmBase64');

const bytes = new Uint8Array(Buffer.from(base64, 'base64'));

// Collect the __wbg_* / __wbindgen_* functions that the WASM module imports from _bg.js
const importFunctions = {};
for (const [key, value] of Object.entries(bg)) {
    if (typeof value === 'function') {
        importFunctions[key] = value;
    }
}

// Synchronous instantiation — same as the original nodejs variant.
// This runs once, lazily, when Cardano code is first used (not at app startup).
const wasmModule = new WebAssembly.Module(bytes.buffer);
const wasmInstance = new WebAssembly.Instance(wasmModule, {
    './cardano_serialization_lib_bg.js': importFunctions,
});

// Wire WASM exports into the _bg.js glue
bg.__wbg_set_wasm(wasmInstance.exports);

// Re-export everything from _bg.js — all CSL classes and functions
module.exports = bg;
