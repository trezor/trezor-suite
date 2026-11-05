// JEST supports only commonJS modules https://jestjs.io/docs/code-transformation
// tsx/cjs is used instead of ts-node/register to handle ESM packages (e.g. @trezor/utils with "type": "module")
require('tsx/cjs');
module.exports = require('./gitHubReporter.ts');
