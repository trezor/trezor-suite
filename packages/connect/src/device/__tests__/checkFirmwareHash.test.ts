import type { ConnectSettings, DeviceUniquePath } from '@trezor/connect-common';
import { DeviceModelInternal } from '@trezor/device-utils';
import type { FirmwareHash } from '@trezor/protobuf/src/definitions';
import type { Descriptor } from '@trezor/transport';
import { Log } from '@trezor/utils';

import { getReleaseByVersion } from '../../data/firmwareInfo';
import * as settingsStore from '../../data/settingsStore';
import { Device } from '../Device';
import type { TypedCallProvider } from '../DeviceCurrentSession';
import { checkFirmwareHash } from '../workflow/checkFirmwareHash';

const { createTestTransport } = global.JestMocks;

const logger = new Log('Test', false);
const transport = createTestTransport();

const getMockedDevice = (typedCallMock?: TypedCallProvider['typedCall']): Device => {
    const device = new Device({
        id: 'mock-device-id' as DeviceUniquePath,
        transport,
        descriptor: {} as Descriptor,
    });

    device.getCurrentSession = () => ({ typedCall: typedCallMock }) as TypedCallProvider;

    device.getVersion = () => [1, 13, 1];

    // @ts-expect-error setting a private property
    device._features = {
        bootloader_mode: false,
        internal_model: DeviceModelInternal.T1B1,
    } as Device['features'];

    return device;
};

jest.mock('../../api/firmware/getBinary', () => ({
    getBinaryOptional: jest.fn(() =>
        Promise.resolve({
            binary: new ArrayBuffer(1024),
            binaryVersion: [1, 13, 1],
            releaseVersion: [1, 13, 1],
        }),
    ),
}));

jest.mock('../../api/firmware/modifyFirmware', () => ({
    stripFwHeaders: jest.fn((b: any) => b),
}));

jest.mock('../../api/firmware/calculateFirmwareHash', () => ({
    calculateFirmwareHash: jest.fn(() => ({ hash: 'expected-hash', challenge: 'challenge' })),
}));

jest.mock('../../data/firmwareInfo', () => ({
    getReleaseByVersion: jest.fn(() => ({ version: [1, 13, 1] })),
    getFirmwareLocation: jest.fn(() => [
        {
            baseUrl: 'https://data.trezor.io',
            path: 'path/to/binary',
        },
    ]),
}));

settingsStore.set({
    binFilesBaseUrl: 'https://example.com',
    enableFirmwareHashCheck: true,
    firmwareHashCheckTimeouts: { T1B1: 1000 },
} as ConnectSettings);

describe(checkFirmwareHash.name, () => {
    afterEach(() => jest.clearAllMocks());

    it('succeeds when hash matches', async () => {
        const message: FirmwareHash = { hash: 'expected-hash' };
        const typedCallMock = () => Promise.resolve({ type: 'FirmwareHash', message });
        const device = getMockedDevice(typedCallMock);
        const result = await checkFirmwareHash({ device, logger });
        expect(result).toEqual({ success: true });
    });

    it('returns hash-mismatch when hash does not match', async () => {
        const message: FirmwareHash = { hash: 'an unexpected hash' };
        const typedCallMock = () => Promise.resolve({ type: 'FirmwareHash', message });
        const device = getMockedDevice(typedCallMock);
        const result = await checkFirmwareHash({ device, logger });
        expect(result).toEqual({ success: false, error: 'hash-mismatch' });
    });

    it('returns other-error if message is malformed', async () => {
        const message: any = { features: 'this is a different response' };
        const typedCallMock = () => Promise.resolve({ type: 'FirmwareHash', message });
        const device = getMockedDevice(typedCallMock);
        const result = await checkFirmwareHash({ device, logger });
        expect(result).toEqual({
            success: false,
            error: 'other-error',
            errorPayload: 'Device response is missing hash',
        });
    });

    it('returns other-error if typed call throws exception', async () => {
        const typedCallMock = () => Promise.reject('this is bug');
        const device = getMockedDevice(typedCallMock);
        const result = await checkFirmwareHash({ device, logger });
        expect(result).toEqual({
            success: false,
            error: 'other-error',
            errorPayload: 'this is bug',
        });
    });

    it('returns takes-too-long if duration exceeds limit', async () => {
        jest.spyOn(performance, 'now')
            .mockImplementationOnce(() => 500)
            .mockImplementationOnce(() => 2500);
        const message: FirmwareHash = { hash: 'expected-hash' };
        const typedCallMock = () => Promise.resolve({ type: 'FirmwareHash', message });
        const device = getMockedDevice(typedCallMock);
        const result = await checkFirmwareHash({ device, logger });
        expect(result).toEqual({ success: false, error: 'takes-too-long' });
    });

    it('returns unknown-release if version cannot be found in releases', async () => {
        const device = getMockedDevice();
        (getReleaseByVersion as jest.Mock).mockReturnValue(null);
        device.getVersion = () => [1, 99, 99];
        const result = await checkFirmwareHash({ device, logger });
        expect(result).toEqual({ success: false, error: 'unknown-release' });
    });
});
