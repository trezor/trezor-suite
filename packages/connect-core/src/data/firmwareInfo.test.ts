import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { firmwareReleaseConfigAssets } from '@trezor/connect-data';
import type { ConditionalRelease } from '@trezor/device-utils';
import { FirmwareType } from '@trezor/device-utils';
import { DeviceModelInternal } from '@trezor/protobuf/src/definitions';

import {
    calculateShouldOfferRelease,
    getFirmwareLocation,
    getFirmwareReleaseConfigInfo,
    getFirmwareStatus,
    getLocalFirmwareConfig,
    selectFirmwareRelease,
} from './firmwareInfo';
import {
    calculateShouldOfferReleaseFixture,
    getFirmwareReleaseConfigInfoFixture,
    selectFirmwareReleaseFixtures,
} from './firmwareInfo.fixture';
import * as firmwareReleaseStore from './firmwareReleaseStore';
import * as settingsStore from './settingsStore';

describe('data/firmwareInfo', () => {
    describe('getFirmwareStatus', () => {
        it('getFirmwareStatus should return none when no incomplete features and firmware is not present', () => {
            expect(
                // @ts-expect-error, incomplete Features
                getFirmwareStatus({ firmware_present: false }),
            ).toEqual('none');
        });
        it('getFirmwareStatus should return unknown when incomplete Features', () => {
            expect(
                // @ts-expect-error, incomplete Features
                getFirmwareStatus({ major_version: 1, bootloader_mode: true }),
            ).toEqual('unknown');
        });
    });
    describe('selectFirmwareRelease', () => {
        it.each(selectFirmwareReleaseFixtures)(
            '$desc',
            ({ features, release, releasesOfDevice, intermediaries, result, error }) => {
                const select = () =>
                    selectFirmwareRelease(features, release, [...releasesOfDevice], intermediaries);

                if (error) {
                    expect(select).toThrow(error);
                } else {
                    expect(select()).toStrictEqual(result);
                }
            },
        );
    });
    describe('calculateShouldOfferRelease', () => {
        it.each(calculateShouldOfferReleaseFixture)(
            '$desc',
            ({ rollout_probability, deviceId, result, error }) => {
                const calculate = () =>
                    calculateShouldOfferRelease(
                        { conditions: { rollout_probability } } as ConditionalRelease,
                        deviceId,
                    );

                if (error) {
                    expect(calculate).toThrow(error);
                } else {
                    expect(calculate()).toBe(result);
                }
            },
        );
    });
    describe('getFirmwareReleaseConfigInfo', () => {
        beforeAll(() => {
            const settings = parseConnectSettings({});
            settingsStore.set(settings);
            firmwareReleaseStore.init(getLocalFirmwareConfig());
        });

        it.each(getFirmwareReleaseConfigInfoFixture)('$desc', ({ features, result }) => {
            const configInfo = getFirmwareReleaseConfigInfo(features, FirmwareType.Universal);
            expect(configInfo).toMatchObject(result);
        });
    });

    describe('getFirmwareLocation', () => {
        const deviceModel = DeviceModelInternal.T2T1;
        const firmwareType = FirmwareType.Universal;

        const setBinFilesBaseUrl = (binFilesBaseUrl: string) =>
            settingsStore.set(parseConnectSettings({ binFilesBaseUrl }));

        // The bundled binaries are only used when their version matches the requested one.
        const getBundledFirmwareVersion = () => {
            const releasePath =
                firmwareReleaseConfigAssets.releases[deviceModel]?.[firmwareType]?.releasePath;
            const version = releasePath?.match(/(\d+)\.(\d+)\.(\d+)/);
            if (!version) throw new Error('No bundled release for the tested device model.');

            return [Number(version[1]), Number(version[2]), Number(version[3])] as const;
        };

        const locate = () =>
            getFirmwareLocation({
                firmwareVersion: [...getBundledFirmwareVersion()],
                remotePath: 'firmware/t2t1/universal/remote.bin',
                deviceModel,
                firmwareType,
            });

        beforeAll(() => {
            const settings = parseConnectSettings({});
            settingsStore.set(settings);
            firmwareReleaseStore.init(getLocalFirmwareConfig());
        });

        it('uses the bundled location for a local base url', () => {
            setBinFilesBaseUrl('/static/connect/data');

            expect(locate().baseUrl).toBe('/static/connect/data');
        });

        it('ignores a base url pointing at the remote firmware host', () => {
            setBinFilesBaseUrl('https://data.trezor.io/firmware');

            expect(locate()).toEqual({
                baseUrl: 'https://data.trezor.io',
                path: 'firmware/t2t1/universal/remote.bin',
            });
        });

        it('treats a host that merely contains the remote one as bundled', () => {
            setBinFilesBaseUrl('https://example.com/data.trezor.io');

            expect(locate().baseUrl).toBe('https://example.com/data.trezor.io');
        });
    });
});
