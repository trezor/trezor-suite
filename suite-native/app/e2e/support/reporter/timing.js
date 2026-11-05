// JEST supports only commonJS modules https://jestjs.io/docs/code-transformation
require('tsx/cjs');
module.exports = require('./timingReporter.ts').TimingReporter;
