import * as fs from 'node:fs';
import * as path from 'node:path';

// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';
import {
    EmulatorWrapper,
    type RecordingFixture,
    assertFixtureMatchesBinary,
    reconstructBinaryFromFixture,
} from '@trezor/emulator-wrapper';
import { UdpTransport } from '@trezor/transport';
import { MNEMONICS, Model } from '@trezor/trezor-user-env-link';

import { getController, initTrezorConnect } from '../../common.setup';

const controller = getController();

const FIXTURE_PATH = path.resolve(
    __dirname,
    '../../../../emulator-wrapper/fixtures/firmware-update-T2T1-trezor-t2t1-2.9.1.json',
);
const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_MAIN_PORT = 21324;
const EMULATOR_DEBUG_PORT = 21325;

const readFixture = (): RecordingFixture =>
    JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')) as RecordingFixture;

// The binary is reconstructed from the fixture's own FirmwareUpload payloads,
// not read from @trezor/connect-data — that package bumps and prunes bundled
// firmware versions over time, which would otherwise break this test whenever
// the recorded version stops shipping. The fixture is the single source of
// truth for both the device replies and the binary fed to Connect.
const toArrayBuffer = (buf: Buffer): ArrayBuffer =>
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

describe('TrezorConnect.firmwareUpdate (replay via EmulatorWrapper)', () => {
    let wrapper: EmulatorWrapper | undefined;
    let firmwareBinary: ArrayBuffer;

    beforeAll(async () => {
        TrezorConnect.dispose();
        await controller.connect();
        await controller.stopEmu();
        await controller.stopBridge();
        await controller.startEmu({ wipe: true, model: Model.T2T1, version: '2-latest' });
        await controller.setupEmu({
            mnemonic: MNEMONICS.mnemonic_all,
            pin: '',
            passphrase_protection: false,
            label: 'TrezorT',
            needs_backup: false,
        });

        const fixture = readFixture();
        const reconstructed = reconstructBinaryFromFixture(fixture);
        assertFixtureMatchesBinary(fixture, reconstructed);
        firmwareBinary = toArrayBuffer(reconstructed);
        wrapper = new EmulatorWrapper({
            main: { listenPort: 0, targetHost: EMULATOR_HOST, targetPort: EMULATOR_MAIN_PORT },
            debug: { listenPort: 0, targetHost: EMULATOR_HOST, targetPort: EMULATOR_DEBUG_PORT },
            intercept: { firmwareUpdate: { fixture } },
            logger: msg => console.warn('[wrapper]', msg),
        });
        await wrapper.start();
        const endpoints = wrapper.getEndpoints();
        const mainEndpoint = endpoints[0]!;
        const debugEndpoint = endpoints[1]!;

        await initTrezorConnect(controller, {
            transports: [
                new UdpTransport({
                    id: 'emulator-wrapper-udp',
                    target: {
                        host: EMULATOR_HOST,
                        mainPort: mainEndpoint.listenPort,
                        debugPort: debugEndpoint.listenPort,
                    },
                }),
            ],
            pendingTransportEvent: true,
        });
    });

    afterAll(async () => {
        TrezorConnect.dispose();
        await wrapper?.stop();
        wrapper = undefined;
        controller.dispose();
    });

    it('returns success replaying the recorded T2T1 2.9.1 firmware update', async () => {
        const result = await TrezorConnect.firmwareUpdate({ binary: firmwareBinary });

        if (!result.success) {
            throw new Error(`firmwareUpdate failed: ${JSON.stringify(result.error)}`);
        }
        expect(result.success).toBe(true);
        expect(result.payload.versionCheck).toBe(true);
        expect(result.payload.installedVersion).toEqual([2, 9, 1]);
        expect(result.payload.binaryVersion).toEqual([2, 9, 1]);
    });
});
