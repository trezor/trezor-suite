// Replaces the asm.js module under jest.config.csl-trace.cjs and records every export the glue
// touches to CSL_TRACE_FILE.
/* eslint-disable import/no-extraneous-dependencies -- Build tooling, not runtime dependencies. */
const wasm = require('@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.asm.js');
const fs = require('fs');

const recorded = new Set();

module.exports = new Proxy(wasm, {
    get(target, property) {
        if (typeof property === 'string' && property in target && !recorded.has(property)) {
            recorded.add(property);
            fs.appendFileSync(process.env.CSL_TRACE_FILE, `${property}\n`);
        }

        return target[property];
    },
});
