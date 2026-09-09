const { execFileSync } = require('child_process');
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const usbDirectory = path.dirname(require.resolve('usb/package.json'));
const prebuildsDirectory = path.join(__dirname, 'prebuilds');
const patchPath = path.resolve(__dirname, '../../../.yarn/patches/usb-npm-2.17.0-032235560c.patch');

const hashFile = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const buildUsb = () => {
    const header = fs.readFileSync(path.join(usbDirectory, 'src/hotplug/hotplug.h'), 'utf8');
    if (!header.includes('virtual ~HotPlugManager() = default;')) {
        throw new Error('The USB shutdown patch is missing. Apply the Yarn patch before building.');
    }

    execFileSync(
        process.execPath,
        [
            require.resolve('node-gyp/bin/node-gyp.js'),
            'rebuild',
            '--directory',
            usbDirectory,
            '--jobs=2',
        ],
        { stdio: 'inherit' },
    );

    const directory = path.join(prebuildsDirectory, `${process.platform}-${process.arch}`);
    fs.mkdirSync(directory, { recursive: true });
    const binary = path.join(directory, 'usb_bindings.node');
    fs.copyFileSync(path.join(usbDirectory, 'build/Release/usb_bindings.node'), binary);
    fs.writeFileSync(
        path.join(directory, 'manifest.json'),
        JSON.stringify({
            platform: process.platform,
            arch: process.arch,
            version: JSON.parse(fs.readFileSync(path.join(usbDirectory, 'package.json'), 'utf8'))
                .version,
            patchHash: hashFile(patchPath),
            binaryHash: hashFile(binary),
        }),
    );
};

const stageUsb = ({
    platform,
    arch,
    usbPath = usbDirectory,
    prebuildsPath = prebuildsDirectory,
    sourcePatchPath = patchPath,
}) => {
    const target = `${platform}-${arch}`;
    const directory = path.join(prebuildsPath, target);
    const manifestPath = path.join(directory, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(
            `Missing patched USB build for ${target}. Download the build-usb-native workflow artifacts into usb-patch/prebuilds before cross-packaging.`,
        );
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const { version } = JSON.parse(fs.readFileSync(path.join(usbPath, 'package.json'), 'utf8'));
    const binary = path.join(directory, 'usb_bindings.node');
    if (
        manifest.platform !== platform ||
        manifest.arch !== arch ||
        manifest.version !== version ||
        manifest.patchHash !== hashFile(sourcePatchPath) ||
        manifest.binaryHash !== hashFile(binary)
    ) {
        throw new Error(`Invalid or stale patched USB build for ${target}. Rebuild its artifact.`);
    }

    // Remove other native build outputs so only this target's verified binary is packaged.
    fs.rmSync(path.join(usbPath, 'build'), { recursive: true, force: true });
    const output = path.join(usbPath, 'build/Release');
    fs.mkdirSync(output, { recursive: true });
    fs.copyFileSync(binary, path.join(output, 'usb_bindings.node'));
    fs.copyFileSync(manifestPath, path.join(output, 'manifest.json'));
};

module.exports = { buildUsb, stageUsb };

if (require.main === module) {
    buildUsb();
}
