// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const cypressTypeScriptPreprocessor = require('./ts-preprocessor')

module.exports = on => {
    addMatchImageSnapshotPlugin(on);
    on('file:preprocessor', cypressTypeScriptPreprocessor);
};
