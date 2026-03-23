import { firmwareAssets } from '@trezor/connect-data';
import { FirmwareType } from '@trezor/device-utils';
import { DeviceModelInternal } from '@trezor/protobuf/src/messages-schema';
import { versionUtils } from '@trezor/utils';

import { getDeviceFeatures } from '../../../setupJest';
import { DataManager } from '../DataManager';
import { parseConnectSettings } from '../connectSettings';
import {
    getFirmwareReleaseConfigInfo,
    getFirmwareStatus,
    initializeFirmwareConfig,
} from '../firmwareInfo';

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
    describe('getFirmwareReleaseConfigInfo', () => {
        beforeAll(async () => {
            await DataManager.load(parseConnectSettings({}), true, true, initializeFirmwareConfig);
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
            const [latestRelase] = Object.values(firmwareAssets.t1b1.universal).sort((a, b) =>
                versionUtils.isNewer(b.version, a.version) ? 1 : -1,
            );
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
            expect(firmwareReleaseConfigInfo?.intermediary).toBeTruthy();
            expect(firmwareReleaseConfigInfo?.release.version).toEqual(latestRelase.version);
        });
    });
});
