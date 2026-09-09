// Electron Builder runs this hook during packaging.
// eslint-disable-next-line import/no-extraneous-dependencies
const { Arch } = require('electron-builder');
const fs = require('fs');
const path = require('path');

const { buildUsb, stageUsb } = require('./buildUsb.cjs');

module.exports = context => {
    const platform = context.electronPlatformName;
    const arch = Arch[context.arch];

    const manifest = path.join(__dirname, 'prebuilds', `${platform}-${arch}`, 'manifest.json');
    if (!fs.existsSync(manifest) && platform === process.platform && arch === process.arch) {
        buildUsb();
    }

    stageUsb({ platform, arch });
};
