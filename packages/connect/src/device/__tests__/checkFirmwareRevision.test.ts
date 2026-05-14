import { FetchError } from 'node-fetch';

import type { FirmwareRevisionCheckResult } from '@trezor/connect-common/src/types/device';
import type { FirmwareRelease } from '@trezor/device-utils';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import { httpRequest } from '../../utils/assets';
import type { CheckFirmwareRevisionParams } from '../checkFirmwareRevision';
import { checkFirmwareRevision } from '../checkFirmwareRevision';

jest.mock('../../utils/assets', () => ({
    ...jest.requireActual('../../utils/assets'),
    httpRequest: jest.fn(jest.requireActual('../../utils/assets').httpRequest),
}));

const ONLINE_RELEASES_JSON_MOCK: FirmwareRelease = {
    required: false,
    version: [2, 7, 2],
    bootloader_version: [1, 12, 1],
    min_firmware_version: [1, 12, 0],
    min_bootloader_version: [1, 12, 0],
    url: 'firmware/t1b1/trezor-t1b1-1.12.1.bin',
    fingerprint: '3c694191f5b66a65cb5bb209adbf113cb40209e644b77162ba996bb7ee8f382b',
    firmware_revision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
    translations: {
        'cs-CZ': 'firmware/translations/t1b1/translation-T2T1-cs-CZ-2.7.2.bin',
        'de-DE': 'firmware/translations/t1b1/translation-T2T1-de-DE-2.7.2.bin',
        'es-ES': 'firmware/translations/t1b1/translation-T2T1-es-ES-2.7.2.bin',
        'fr-FR': 'firmware/translations/t1b1/translation-T2T1-fr-FR-2.7.2.bin',
        'it-IT': 'firmware/translations/t1b1/translation-T2T1-it-IT-2.7.2.bin',
        'pt-BR': 'firmware/translations/t1b1/translation-T2T1-pt-BR-2.7.2.bin',
    },
    changelog: '* A\n* B\n* C',
};

const DeviceNames = Object.values(DeviceModelInternal);

type CreateDeviceParams = Omit<CheckFirmwareRevisionParams, 'internalModel' | 'firmwareType'>;

const createDeviceParams = (params: Partial<CreateDeviceParams>): CreateDeviceParams => ({
    deviceRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
    firmwareVersion: [2, 7, 2],
    expectedRevision: '1eb0eb9d91b092e571aac63db4ebff2a07fd8a1f',
    ...params,
});

describe.each(DeviceNames)(`${checkFirmwareRevision.name} for device %s`, internalModel => {
    it.each<{
        it: string;
        httpRequestMock?: () => Promise<FirmwareRelease>;
        params: CreateDeviceParams;
        expected: FirmwareRevisionCheckResult;
    }>([
        {
            it: 'passes when firmware revision is same as in static file',
            params: createDeviceParams({}),
            expected: { success: true },
        },
        {
            it: 'errors when firmware revision is NOT same as in static file',
            params: createDeviceParams({
                expectedRevision: 'cde8f31ec2ddcb7d35e36edbcf8a71dda983a9ea',
            }),
            expected: { success: false, error: 'revision-mismatch' },
        },
        {
            it: 'errors when firmware revision is not provided',
            params: createDeviceParams({
                deviceRevision: undefined,
                expectedRevision: 'cde8f31ec2ddcb7d35e36edbcf8a71dda983a9ea',
            }),
            expected: { success: false, error: 'revision-mismatch' },
        },
        {
            it: 'passes when firmware version is not found locally, but found in the online release',
            httpRequestMock: () => Promise.resolve(ONLINE_RELEASES_JSON_MOCK),
            params: createDeviceParams({
                expectedRevision: undefined, // firmware not known by local releases.json file
            }),
            expected: { success: true },
        },
        {
            it: 'errors when firmware version is not found locally, found in the online release, but does NOT match',
            httpRequestMock: () => Promise.resolve(ONLINE_RELEASES_JSON_MOCK),
            params: createDeviceParams({
                deviceRevision: '1234567890987654321',
                expectedRevision: undefined, // firmware not known by local releases.json file
            }),
            expected: { success: false, error: 'revision-mismatch' },
        },
        {
            it: 'errors when firmware version is not found locally, and also not in the online release',
            httpRequestMock: () => Promise.resolve(ONLINE_RELEASES_JSON_MOCK),
            params: createDeviceParams({
                deviceRevision: '1234567890987654321',
                firmwareVersion: [2, 9, 9], // completely unrecognized version
                expectedRevision: undefined,
            }),
            expected: { success: false, error: 'firmware-version-unknown' },
        },
        {
            it: 'errors with a specific error message when the check cannot be performed because the revision is not found locally and the user is offline',
            httpRequestMock: () => {
                throw new FetchError('You are offline!', 'network', {
                    code: 'ENOTFOUND',
                    name: 'FetchError',
                    message: 'You are offline!',
                });
            },
            params: createDeviceParams({
                expectedRevision: undefined, // firmware not known by local releases.json file
            }),
            expected: { success: false, error: 'cannot-perform-check-offline' },
        },
        {
            it: 'errors with a generic error message when there is an error when reading the online version of releases.json',
            httpRequestMock: () => {
                throw new Error('There is an unexpected error!');
            },
            params: createDeviceParams({
                expectedRevision: undefined, // firmware not known by local releases.json file
            }),
            expected: { success: false, error: 'other-error', errorPayload: expect.anything() },
        },
    ])(`$it`, async ({ params, expected, httpRequestMock }) => {
        if (httpRequestMock !== undefined) {
            (httpRequest as jest.Mock).mockImplementation(httpRequestMock);
        }

        const result = await checkFirmwareRevision({
            ...params,
            internalModel,
            firmwareType: FirmwareType.Universal,
        });

        expect(result).toStrictEqual(expected);
    });
});
