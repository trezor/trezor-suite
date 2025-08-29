import { FirmwareType } from '@trezor/device-utils';
import { DeviceModelInternal } from '@trezor/protobuf/src/messages-schema';

import { getDeviceFeatures } from '../../../setupJest';
import { DataManager } from '../DataManager';
import { parseConnectSettings } from '../connectSettings';
import { getFirmwareReleaseConfigInfo, getFirmwareStatus } from '../firmwareInfo';

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
            await DataManager.load(parseConnectSettings({}), true, true);
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
    });
});
