import { DeviceModelInternal } from '@trezor/protobuf';
import { checkFirmwareRevision, CheckFirmwareRevisionParams } from '../checkFirmwareRevision';
import { FirmwareRelease, FirmwareRevisionCheckResult } from '../../exports';
import * as utilsAssets from '../../utils/assets';

const ONLINE_RELEASES_JSON_MOCK: FirmwareRelease[] = [
    {
        required: false,
        version: [2, 7, 2],
        bootloader_version: [1, 12, 1],
        min_firmware_version: [1, 12, 0],
        min_bootloader_version: [1, 12, 0],
        url: 'firmware/t1b1/trezor-t1b1-1.12.1.bin',
        url_bitcoinonly: 'firmware/t1b1/trezor-t1b1-1.12.1-bitcoinonly.bin',
        fingerprint: '3c694191f5b66a65cb5bb209adbf113cb40209e644b77162ba996bb7ee8f382b',
        fingerprint_bitcoinonly: '985fb6a8c87f7547fb810f6c4a8331ebf19c677445810358778eb21eca78a181',
        firmware_revision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
        changelog: '* A\n* B\n* C',
    },
];

const createDevicePrams = (
    params: Partial<CheckFirmwareRevisionParams>,
): CheckFirmwareRevisionParams => ({
    deviceRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
    firmwareVersion: [2, 7, 2],
    expectedRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
    internalModel: DeviceModelInternal.T1B1,
    ...params,
});

describe(checkFirmwareRevision.name, () => {
    it.each<{
        it: string;
        httpRequestMock?: () => Promise<FirmwareRelease[]>;
        params: CheckFirmwareRevisionParams;
        expected: FirmwareRevisionCheckResult;
    }>([
        {
            it: 'passes when firmware revision is same as in static file',
            params: createDevicePrams({
                deviceRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
                expectedRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
            }),
            expected: { success: true },
        },
        {
            it: 'fails when firmware revision is NOT same as in static file',
            params: createDevicePrams({
                deviceRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
                expectedRevision: 'cde8f31ec2ddcb7d35e36edbcf8a71dda983a9ea',
            }),
            expected: { success: false, error: 'revision-mismatch' },
        },
        {
            it: 'fails when firmware revision is not provided',
            params: createDevicePrams({
                deviceRevision: undefined,
                expectedRevision: 'cde8f31ec2ddcb7d35e36edbcf8a71dda983a9ea',
            }),
            expected: { success: false, error: 'revision-mismatch' },
        },
        {
            it: 'fails when firmware version is not found locally, and also not in the online release',
            httpRequestMock: () => Promise.resolve(ONLINE_RELEASES_JSON_MOCK),
            params: createDevicePrams({
                deviceRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
                expectedRevision: undefined, // firmware not known by local releases.json file
            }),
            expected: { success: false, error: 'firmware-version-unknown' },
        },
        {
            it:
                'returns null (NOT SUCCESS / NOT ERROR) when firmware version is not found locally, and the user is offline' +
                'In this case. User SHALL BE warned to go ONLINE and UPGRADE before doing anything!',
            httpRequestMock: () => {
                throw new Error('You are offline!');
            },
            params: createDevicePrams({
                deviceRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
                expectedRevision: undefined, // firmware not known by local releases.json file
            }),
            expected: { success: false, error: 'cannot-perform-check-offline' },
        },
        {
            it: "doesn't check anything for new versions with security chip (not implemented yet)",
            params: createDevicePrams({
                deviceRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
                expectedRevision: 'cde8f31ec2ddcb7d35e36edbcf8a71dda983a9ea',
                internalModel: DeviceModelInternal.T3B1,
            }),
            expected: { success: true },
        },
    ])(`$it`, async ({ params, expected, httpRequestMock }) => {
        if (httpRequestMock !== undefined) {
            jest.spyOn(utilsAssets, 'httpRequest').mockImplementation(httpRequestMock);
        }

        const result = await checkFirmwareRevision(params);

        expect(result).toStrictEqual(expected);
    });
});
