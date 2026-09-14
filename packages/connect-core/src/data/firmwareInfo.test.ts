import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { firmwareAssets, firmwareReleaseConfigAssets } from '@trezor/connect-data';
import type { ConditionalRelease, FirmwareRelease } from '@trezor/device-utils';
import { FirmwareType } from '@trezor/device-utils';
import { DeviceModelInternal } from '@trezor/protobuf/src/definitions';
import { getIntegerInRangeFromString, versionUtils } from '@trezor/utils';

import {
    calculateShouldOfferRelease,
    getFirmwareLocation,
    getFirmwareReleaseConfigInfo,
    getFirmwareStatus,
    getLocalFirmwareConfig,
    selectFirmwareRelease,
} from './firmwareInfo';
import {
    selectFirmwareReleaseErrorFixtures,
    selectFirmwareReleaseFixtures,
} from './firmwareInfo.fixture';
import * as firmwareReleaseStore from './firmwareReleaseStore';
import * as settingsStore from './settingsStore';
import { getDeviceFeatures } from '../../setupJest';

describe('data/firmwareInfo', () => {
    describe('getFirmwareStatus', () => {
        it('getFirmwareStatus should return none when no incomplet features and firmware is not present', () => {
            expect(
                // @ts-expect-error, incomplete Features
                getFirmwareStatus({
                    firmware_present: false,
                }),
            ).toEqual('none');
        });
        it('getFirmwareStatus should return unknown when incomplete Features', () => {
            expect(
                // @ts-expect-error, incomplete Features
                getFirmwareStatus({
                    major_version: 1,
                    bootloader_mode: true,
                }),
            ).toEqual('unknown');
        });
    });

    describe('selectFirmwareRelease', () => {
        it.each(selectFirmwareReleaseFixtures)(
            '$desc',
            ({ features, release, releasesOfDevice, intermediaries, result }) => {
                expect(
                    selectFirmwareRelease(features, release, [...releasesOfDevice], intermediaries),
                ).toStrictEqual(result);
            },
        );

        it.each(selectFirmwareReleaseErrorFixtures)(
            'throws in $desc',
            ({ features, release, releasesOfDevice, intermediaries, error }) => {
                expect(() =>
                    selectFirmwareRelease(features, release, [...releasesOfDevice], intermediaries),
                ).toThrow(error);
            },
        );
    });

    describe('calculateShouldOfferRelease', () => {
        const deviceId = '36647600C9CEB95187D31BC5';
        const deviceBucket = getIntegerInRangeFromString(deviceId, 100);
        const mockConditionalRelease = (rolloutProbability: number): ConditionalRelease => ({
            firmware_type: FirmwareType.Universal,
            releasePath: 'firmware/release.json',
            conditions: {
                environment: { min_suite_version: '0.0.0', min_suite_native_version: '0.0.0' },
                rollout_probability: rolloutProbability,
            },
        });

        it.each([
            {
                desc: 'does not offer a release at 0% rollout',
                rolloutProbability: 0,
                deviceId,
                shouldBeOffered: false,
            },
            {
                desc: 'offers a release at 100% rollout to a device in the formerly excluded bucket',
                rolloutProbability: 100,
                deviceId,
                shouldBeOffered: true,
            },
            {
                desc: 'does not offer a release when the device bucket equals the rollout threshold',
                rolloutProbability: deviceBucket,
                deviceId,
                shouldBeOffered: false,
            },
            {
                desc: 'offers a release when the device bucket is below the rollout threshold',
                rolloutProbability: deviceBucket + 1,
                deviceId,
                shouldBeOffered: true,
            },
            {
                desc: 'does not offer a release without a device id at 0% rollout',
                rolloutProbability: 0,
                deviceId: null,
                shouldBeOffered: false,
            },
            {
                desc: 'offers a release without a device id at a positive rollout',
                rolloutProbability: 1,
                deviceId: null,
                shouldBeOffered: true,
            },
        ])('$desc', ({ rolloutProbability, deviceId: testDeviceId, shouldBeOffered }) => {
            expect(
                calculateShouldOfferRelease(
                    mockConditionalRelease(rolloutProbability),
                    testDeviceId,
                ),
            ).toBe(shouldBeOffered);
        });

        it.each([-1, 101])(
            'rejects an out-of-range rollout probability of %i',
            rolloutProbability => {
                expect(() =>
                    calculateShouldOfferRelease(
                        mockConditionalRelease(rolloutProbability),
                        deviceId,
                    ),
                ).toThrow('Probability must be between 0 and 100.');
            },
        );
    });

    describe('getFirmwareReleaseConfigInfo', () => {
        beforeEach(() => {
            const settings = parseConnectSettings({});
            settingsStore.set(settings);
            firmwareReleaseStore.init(getLocalFirmwareConfig());
        });

        it('should offer latest compatible relase when latest one is not compatible', () => {
            const features = getDeviceFeatures({
                bootloader_mode: null,
                major_version: 2,
                minor_version: 0,
                patch_version: 7,
                internal_model: DeviceModelInternal.T2T1,
            });
            const firmwareReleaseConfigInfo = getFirmwareReleaseConfigInfo(
                features,
                FirmwareType.Universal,
            );
            expect(firmwareReleaseConfigInfo?.release.version).toEqual([2, 1, 1]);
        });

        it('should offer lastest release and intermediary v2 for T1B1 <  1.12.0', () => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const t1b1Assets: { [file: string]: FirmwareRelease } = firmwareAssets.t1b1.universal;
            const sorted = Object.values(t1b1Assets).sort((a, b) =>
                versionUtils.isNewer(b.version, a.version) ? 1 : -1,
            );
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const [latestRelase]: [FirmwareRelease] = sorted;
            const features = getDeviceFeatures({
                bootloader_mode: null,
                major_version: 1,
                minor_version: 11,
                patch_version: 2,
                internal_model: DeviceModelInternal.T1B1,
            });
            const firmwareReleaseConfigInfo = getFirmwareReleaseConfigInfo(
                features,
                FirmwareType.Universal,
            );
            expect(firmwareReleaseConfigInfo?.intermediary?.version).toBe(2);
            expect(firmwareReleaseConfigInfo?.release.version).toEqual(latestRelase.version);
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
