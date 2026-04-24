import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';
import { parseConfigure } from '@trezor/protobuf';
import { v1 as protocolV1 } from '@trezor/protocol';
import { buildMessage } from '@trezor/transport/src/utils/send';
import { Log, bufferUtils } from '@trezor/utils';

import { calculateFirmwareHash } from '../../api/firmware/calculateFirmwareHash';
import { DataManager } from '../../data/DataManager';
import { getBundledRelease, initializeFirmwareConfig } from '../../data/firmwareInfo';
import { DeviceList } from '../../device/DeviceList';
import { httpRequest } from '../../utils/assets';
import { onCallFirmwareUpdate } from '../onCallFirmwareUpdate';

jest.mock('../../utils/assets', () => ({
    ...jest.requireActual('../../utils/assets'),
    httpRequest: jest.fn(jest.requireActual('../../utils/assets').httpRequest),
}));

jest.mock('../../api/firmware/calculateFirmwareHash', () => ({
    ...jest.requireActual('../../api/firmware/calculateFirmwareHash'),
    calculateFirmwareHash: jest.fn(
        jest.requireActual('../../api/firmware/calculateFirmwareHash').calculateFirmwareHash,
    ),
}));

// NOTE:
// to disable asset mock and work with the real binaries (tests takes longer):
// - comment one of ASSETS_BASE_URL's (local or online file)
// - comment jest.setTimeout(30000);
const ASSETS_BASE_URL = '';
// const ASSETS_BASE_URL = require('path').resolve(__dirname, '../../../../', 'connect-data/files');
// const ASSETS_BASE_URL = 'https://suite.trezor.io/web/static/connect/data';
// jest.setTimeout(30000);

const { createTestTransport } = global.JestMocks;

type ResponseFixture = {
    id: string; // messageType from .write
    data: string; // protobuf response from .read
};

const transportApiMock = (fixtures: ResponseFixture[]) => {
    let request = '';
    let eventChangeListener: (...args: any[]) => void;

    const response = (data: string) =>
        Promise.resolve({
            success: true,
            payload: Buffer.from(data, 'hex'),
        });

    const success = '3f23230002000000060a046d656f77';
    const latest = getBundledRelease(DeviceModelInternal.T2T1, FirmwareType.Universal);
    if (!latest) {
        throw new Error('Missing latest bundled release.');
    }

    return {
        on: (evt: string, listener: any) => {
            if (evt === 'transport-interface-change') {
                eventChangeListener = (...args: any[]) => {
                    setTimeout(() => listener(...args), 1);
                };
            }
        },
        once: (evt: string, listener: any) => {
            if (evt === 'transport-interface-change') {
                eventChangeListener = (...args: any[]) => {
                    setTimeout(() => listener(...args), 1);
                };
            }
        },
        emitInterfaceChange: (...args: any[]) => {
            eventChangeListener(...args);
        },
        enumerate: () => Promise.resolve({ success: true, payload: [{ path: '1' }] }),
        write: (_: string, data: Buffer) => {
            request = data.subarray(3, 5).toString('hex');

            return Promise.resolve({ success: true });
        },
        read: () => {
            const index = fixtures.findIndex(f => f.id === request);
            if (index >= 0) {
                const { data } = fixtures[index];
                fixtures.splice(index, 1);

                return response(data);
            }

            if (request === '0057' || request === '0006') {
                // RebootToBootloader (57) > Success
                // FirmwareErase (06) > Success
                eventChangeListener([]); // dispatch disconnected device event

                return response(success);
            } else if (request === '0058') {
                // GetFirmwareHash > FirmwareHash
                return response('3f23230059000000160a14' + latest.firmware_revision);
            }

            // Success
            return response(success);
        },
    };
};

// build protobuf message.
// default: recent release Features
const buildProtobufMessage = (messages: any, override: any = {}) => {
    const major_version = override.data?.major_version || 2;
    const model = major_version === 1 ? 1 : 2;
    const internal_model = major_version === 1 ? 'T1B1' : 'T2T1';
    const deviceModel = major_version === 1 ? DeviceModelInternal.T1B1 : DeviceModelInternal.T2T1;
    const latest = getBundledRelease(deviceModel, FirmwareType.Universal);
    if (!latest) {
        throw new Error('Missing latest bundled release.');
    }
    const [fw_major, fw_minor, fw_patch] = latest.version;
    const version = {
        major_version: fw_major,
        minor_version: fw_minor,
        patch_version: fw_patch,
    };
    if (override.data?.bootloader_mode) {
        const [bl_major, bl_minor, bl_patch] = latest.bootloader_version || [major_version, 0, 0];
        version.major_version = bl_major;
        version.minor_version = bl_minor;
        version.patch_version = bl_patch;
    }

    return buildMessage({
        messages,
        name: override.name || 'Features',
        data: override.name
            ? override.data
            : {
                  ...version,
                  fw_major,
                  fw_minor,
                  fw_patch,
                  firmware_present: override.data?.bootloader_mode ? false : true,
                  model,
                  internal_model,
                  revision: latest.firmware_revision, // used in calculateFirmwareHashMock
                  ...override.data,
              },
        protocol: protocolV1,
    }).toString('hex');
};

const httpRequestMock = (version?: number[]) => {
    const finalVersion =
        version ?? getBundledRelease(DeviceModelInternal.T2T1, FirmwareType.Universal)?.version;

    if (finalVersion === undefined) {
        throw new Error('Firmware version could not be determined.');
    }
    const binary = Buffer.concat([
        Buffer.from('TRZV', 'utf-8'),
        Buffer.from([200]),
        Buffer.alloc(200 - 5),
        Buffer.from('TRZF', 'utf-8'),
        Buffer.alloc(12),
        Buffer.from(finalVersion),
    ]);

    // as ArrayBuffer:
    // binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength)
    return Promise.resolve(binary);
};

const getFirmwareBinaryBytes = async (version?: number[]): Promise<ArrayBuffer> =>
    bufferUtils.bufferToBytes(await httpRequestMock(version));

const calculateFirmwareHashMock = (hash?: string) => ({
    hash:
        hash ||
        getBundledRelease(DeviceModelInternal.T2T1, FirmwareType.Universal)?.firmware_revision ||
        '',
    challenge: '',
});

// common setup for all tests
const setupTest = () => {
    const messages = parseConfigure(DataManager.getProtobufMessages());
    const deviceList = new DeviceList({
        ...DataManager.getSettings(),
        messages,
        // debug: true,
    });

    const fixtures: ResponseFixture[] = [];
    const api = transportApiMock(fixtures);
    const transport = createTestTransport(api);

    const waitForDeviceList = async (f: ResponseFixture[]) => {
        fixtures.push(...f);
        await deviceList.init({ transports: [transport], pendingTransportEvent: true });
        await deviceList.pendingConnection();
    };

    const postMessage = ({ type, payload }: any) => {
        if (type === 'ui-firmware-progress') {
            // T1B1, without automatic reboot to bootloader
            if (payload.operation === 'downloading' && payload.progress === 100) {
                api.emitInterfaceChange([]);
            }
            if (payload.operation === 'flashing' && payload.progress === 100) {
                api.emitInterfaceChange([]);
            }
        }
        if (type === 'ui-firmware_reconnect') {
            if (payload.target === 'bootloader') {
                api.emitInterfaceChange([{ path: '1' }]);
            }
            if (payload.target === 'normal') {
                api.emitInterfaceChange([{ path: '1' }]);
            }
        }
    };

    const buildFixture = (id: string, data: any = {}, name?: string) => ({
        id,
        data: buildProtobufMessage(messages, { data, name }),
    });

    const context = {
        deviceList,
        postMessage,
        selectDevice: () => deviceList.getAllDevices()[0],
        registerEvents: () => {},
        log: new Log('Test', false),
        abortSignal: new AbortController().signal,
        uiPromises: { create: jest.fn(), rejectAll: jest.fn() },
    };

    return {
        context,
        deviceList,
        waitForDeviceList,
        buildFixture,
    };
};

describe('onCallFirmwareUpdate', () => {
    beforeAll(async () => {
        await DataManager.load(parseConnectSettings({}), true, true, initializeFirmwareConfig);
    });
    beforeEach(() => {
        if (!ASSETS_BASE_URL) {
            (httpRequest as jest.Mock).mockImplementation((url, type) => {
                if (type === 'json') {
                    return Promise.reject(new Error('Offline'));
                }

                const intermediary = /.*inter-v(.*)?.bin$/.exec(url);
                if (intermediary) {
                    return httpRequestMock([1, 8, 1]);
                    // switch (intermediary[1]) {
                    //     case '1':
                    //         return httpRequestMock([1, 8, 1]);
                    //     case '2':
                    //         return httpRequestMock([1, 6, 7]);
                    //     case '3':
                    //         return httpRequestMock([1, 6, 7]);
                    //     default:
                    //         throw new Error(`Unknown intermediary version ${url}`);
                    // }
                }

                const version = /.*-(.*)?.bin$/
                    .exec(url)?.[1]
                    .split('.')
                    .map(i => Number(i));

                return httpRequestMock(version);
            });
        }

        (calculateFirmwareHash as jest.Mock).mockImplementation((..._args) =>
            calculateFirmwareHashMock(),
        );
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    const runFirmwareUpdate = async ({
        params,
        context,
    }: Parameters<typeof onCallFirmwareUpdate>[0]) => {
        // onCallFirmwareUpdate is using timeouts while waiting for disconnection
        jest.useFakeTimers();
        const resultPromise = onCallFirmwareUpdate({
            params: { baseUrl: ASSETS_BASE_URL, ...params },
            context,
        });
        await jest.advanceTimersByTimeAsync(10 * 1000);
        jest.useRealTimers();

        return resultPromise;
    };

    it('T2T1: from binary, binary version mismatch', async () => {
        const { context, deviceList, waitForDeviceList, buildFixture } = setupTest();

        await waitForDeviceList([
            // GetFeatures in bootloader mode
            buildFixture('0037', {
                bootloader_mode: true,
            }),
            // Initialize in bootloader mode
            buildFixture('0000', {}),
            // GetFeatures after reboot
            buildFixture('0037', {}),
        ]);

        const binary = await getFirmwareBinaryBytes([2, 8, 3]);
        const result = await runFirmwareUpdate({
            params: { binary },
            context,
        });

        expect(result.versionCheck).toEqual(false);
        expect(result.binaryVersion).not.toEqual(result.installedVersion);

        await deviceList.dispose();
    });

    it('T2T1: updated to latest release', async () => {
        const { context, deviceList, waitForDeviceList, buildFixture } = setupTest();

        await waitForDeviceList([
            // GetFeatures before reboot
            buildFixture('0037', {
                major_version: 2,
                minor_version: 8,
                patch_version: 3,
            }),
            // GetFeatures in bootloader mode
            buildFixture('0037', {
                bootloader_mode: true,
            }),
            // Initialize in bootloader mode
            buildFixture('0000', {}),
            // GetFeatures after reboot
            buildFixture('0037', {}),
        ]);

        const result = await runFirmwareUpdate({
            params: {},
            context,
        });

        expect(result.versionCheck).toEqual(true);

        await deviceList.dispose();
    });

    it('T2T1: started in bootloader_mode', async () => {
        const { context, deviceList, waitForDeviceList, buildFixture } = setupTest();

        await waitForDeviceList([
            // GetFeatures in bootloader mode
            buildFixture('0037', {
                bootloader_mode: true,
            }),
            // Initialize in bootloader mode
            buildFixture('0000', {}),
            // GetFeatures after reboot
            buildFixture('0037', {}),
        ]);

        const result = await runFirmwareUpdate({
            params: {},
            context,
        });

        expect(result.versionCheck).toEqual(true);

        await deviceList.dispose();
    });

    it('T2T1: installed version mismatch', async () => {
        const { context, deviceList, waitForDeviceList, buildFixture } = setupTest();

        await waitForDeviceList([
            // GetFeatures before reboot
            buildFixture('0037', {
                major_version: 2,
                minor_version: 8,
                patch_version: 3,
            }),
            // GetFeatures in bootloader mode
            buildFixture('0037', {
                bootloader_mode: true,
            }),
            // Initialize in bootloader mode
            buildFixture('0000', {}),
            // GetFeatures after reboot
            buildFixture('0037', {
                major_version: 2,
                minor_version: 8,
                patch_version: 2,
            }),
        ]);

        const result = await runFirmwareUpdate({
            params: {},
            context,
        });

        expect(result.versionCheck).toEqual(false);
        expect(result.releaseVersion).toEqual(result.binaryVersion);
        expect(result.releaseVersion).not.toEqual(result.installedVersion);

        await deviceList.dispose();
    });

    it('T2T1: updated from binary', async () => {
        const { context, deviceList, waitForDeviceList, buildFixture } = setupTest();

        await waitForDeviceList([
            // GetFeatures before reboot
            buildFixture('0037', {
                major_version: 2,
                minor_version: 8,
                patch_version: 3,
            }),
            // GetFeatures in bootloader mode
            buildFixture('0037', {
                bootloader_mode: true,
            }),
            // Initialize in bootloader mode
            buildFixture('0000', {}),
            // GetFeatures after reboot
            buildFixture('0037', {}),
        ]);

        const binary = await getFirmwareBinaryBytes();
        const result = await runFirmwareUpdate({
            params: { binary },
            context,
        });

        expect(result.versionCheck).toEqual(true);

        await deviceList.dispose();
    });

    it('T2T1: from binary, started in bootloader_mode', async () => {
        const { context, deviceList, waitForDeviceList, buildFixture } = setupTest();

        await waitForDeviceList([
            // GetFeatures in bootloader mode
            buildFixture('0037', {
                bootloader_mode: true,
            }),
            // Initialize in bootloader mode
            buildFixture('0000', {}),
            // GetFeatures after reboot
            buildFixture('0037', {}),
        ]);

        const binary = await getFirmwareBinaryBytes();
        const result = await runFirmwareUpdate({
            params: { binary },
            context,
        });

        expect(result.versionCheck).toEqual(true);

        await deviceList.dispose();
    });

    it('T1B1: updated to latest release', async () => {
        const { context, deviceList, waitForDeviceList, buildFixture } = setupTest();

        // NOTE: to avoid intermediary always update from latest to latest
        const t1 = {
            major_version: 1,
        };

        // NOTE: 1.11.1 is using intermediary v2
        await waitForDeviceList([
            // GetFeatures before reboot
            buildFixture('0037', { ...t1 }),
            // GetFeatures in bootloader mode
            buildFixture('0037', { ...t1, bootloader_mode: true }),
            // Initialize in bootloader mode
            buildFixture('0000', { ...t1, bootloader_mode: true }),
            // GetFeatures after reboot
            buildFixture('0037', { ...t1 }),
        ]);

        const result = await runFirmwareUpdate({
            params: {},
            context,
        });

        expect(result.versionCheck).toEqual(true);

        await deviceList.dispose();
    });

    it('T1B1: intermediary v1', async () => {
        const { context, deviceList, waitForDeviceList, buildFixture } = setupTest();

        const t1 = {
            major_version: 1,
        };

        await waitForDeviceList([
            // GetFeatures before reboot
            buildFixture('0037', { ...t1, minor_version: 0, patch_version: 0 }),
            // GetFeatures in bootloader mode
            buildFixture('0037', {
                ...t1,
                bootloader_mode: true,
                minor_version: 0,
                patch_version: 0,
            }),
            // Initialize in bootloader mode
            buildFixture('0000', {
                ...t1,
                bootloader_mode: true,
                minor_version: 0,
                patch_version: 0,
            }),
            // GetFeatures in bootloader mode after intermediary installation
            buildFixture('0037', {
                ...t1,
                bootloader_mode: true,
            }),
            // Initialize in bootloader mode
            buildFixture('0000', { ...t1, bootloader_mode: true }),
            // GetFeatures after reboot
            buildFixture('0037', { ...t1 }),
        ]);

        const result = await runFirmwareUpdate({
            params: {},
            context,
        });

        expect(result.versionCheck).toEqual(true);

        await deviceList.dispose();
    });
});
