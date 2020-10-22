// Download extensions
const pkg = require('../package.json');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const unzip = require('unzip-crx-3');
const rimraf = require('rimraf');

const extensions = path.join(__dirname, '..', 'extensions');

const downloadExtension = async id => {
    const directory = path.join(extensions, id);
    const filename = `${directory}.crx`;

    if (fs.existsSync(directory)) {
        rimraf.sync(directory);
    }

    const res = await fetch(`https://clients2.google.com/service/update2/crx?response=redirect&prodversion=64&acceptformat=crx2,crx3&x=id%3D${id}%26uc`);
    const dest = fs.createWriteStream(filename);
    res.body.pipe(dest);
    res.body.on('end', async () => {
        await unzip(filename);
        fs.unlinkSync(filename);
    });
    dest.on('error', err => {
        throw new Error(err);
    });
};

if (!fs.existsSync(extensions)) {
    fs.mkdirSync(extensions);
}

pkg.extensions.forEach(ext => {
    downloadExtension(ext)
        .then(() => console.log(ext, 'downloaded successfully'))
        .catch(err => console.error(ext, err));
});
