/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const cypressTypeScriptPreprocessor = require('./ts-preprocessor');

module.exports = on => {
    addMatchImageSnapshotPlugin(on);
    on('file:preprocessor', cypressTypeScriptPreprocessor);
};
