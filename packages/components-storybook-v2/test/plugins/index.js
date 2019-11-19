// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');

module.exports = on => {
    addMatchImageSnapshotPlugin(on);
};
