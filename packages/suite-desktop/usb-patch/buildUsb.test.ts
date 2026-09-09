import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const { stageUsb } = require('./buildUsb.cjs');

describe('patched USB packaging', () => {
    let directory: string;
    let usbPath: string;
    let prebuildsPath: string;
    let sourcePatchPath: string;
    let artifactPath: string;

    const stage = () =>
        stageUsb({ platform: 'linux', arch: 'x64', usbPath, prebuildsPath, sourcePatchPath });

    beforeEach(() => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'suite-usb-packaging-'));
        usbPath = path.join(directory, 'usb');
        prebuildsPath = path.join(directory, 'prebuilds');
        sourcePatchPath = path.join(directory, 'usb.patch');
        artifactPath = path.join(prebuildsPath, 'linux-x64');
        fs.mkdirSync(path.join(usbPath, 'build/Debug'), { recursive: true });
        fs.mkdirSync(artifactPath, { recursive: true });
        fs.writeFileSync(path.join(usbPath, 'package.json'), JSON.stringify({ version: '2.17.0' }));
        fs.writeFileSync(path.join(usbPath, 'build/Debug/stale.node'), 'previous target');
        fs.writeFileSync(sourcePatchPath, 'USB source patch');
        fs.writeFileSync(path.join(artifactPath, 'usb_bindings.node'), 'patched binary');
        fs.writeFileSync(
            path.join(artifactPath, 'manifest.json'),
            JSON.stringify({
                platform: 'linux',
                arch: 'x64',
                version: '2.17.0',
                patchHash: createHash('sha256').update('USB source patch').digest('hex'),
                binaryHash: createHash('sha256').update('patched binary').digest('hex'),
            }),
        );
    });

    afterEach(() => {
        fs.rmSync(directory, { recursive: true, force: true });
    });

    it('stages the verified binary and manifest and removes previous native build outputs', () => {
        stage();

        expect(fs.readdirSync(path.join(usbPath, 'build'))).toEqual(['Release']);
        expect(fs.readFileSync(path.join(usbPath, 'build/Release/usb_bindings.node'), 'utf8')).toBe(
            'patched binary',
        );
        expect(fs.readFileSync(path.join(usbPath, 'build/Release/manifest.json'), 'utf8')).toBe(
            fs.readFileSync(path.join(artifactPath, 'manifest.json'), 'utf8'),
        );
    });

    it.each(['platform', 'arch', 'version', 'patchHash', 'binaryHash'])(
        'rejects a build with mismatched %s before replacing the installed binary',
        field => {
            const manifestPath = path.join(artifactPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, [field]: 'incorrect' }));

            expect(stage).toThrow('Invalid or stale patched USB build for linux-x64');
            expect(fs.existsSync(path.join(usbPath, 'build/Debug/stale.node'))).toBe(true);
        },
    );

    it('rejects a binary changed after its manifest was generated', () => {
        fs.writeFileSync(path.join(artifactPath, 'usb_bindings.node'), 'unpatched binary');

        expect(stage).toThrow('Invalid or stale patched USB build for linux-x64');
    });

    it('rejects an artifact produced for an older patch', () => {
        fs.writeFileSync(sourcePatchPath, 'updated USB source patch');

        expect(stage).toThrow('Invalid or stale patched USB build for linux-x64');
    });

    it('fails when the target artifact is missing', () => {
        fs.rmSync(artifactPath, { recursive: true });

        expect(stage).toThrow('Missing patched USB build for linux-x64');
    });
});
