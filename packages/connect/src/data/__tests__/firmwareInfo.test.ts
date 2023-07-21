import { getReleases, parseFirmware, getFirmwareStatus } from '../firmwareInfo';
import * as releases2 from '@trezor/connect-common/files/firmware/t2t1/releases.json';
import { DeviceModelInternal } from '../../types';

describe('data/firmwareInfo', () => {
    beforeEach(() => {
        parseFirmware(releases2, DeviceModelInternal.T2T1);
    });

    test('getReleases', () => {
        expect(getReleases(DeviceModelInternal.T2T1)[0]).toMatchObject({
            ...releases2[0],
            url: expect.any(String),
            url_bitcoinonly: expect.any(String),
        });
    });

    test('getFirmwareStatus', () => {
        expect(
            // @ts-expect-error, incomplete Features
            getFirmwareStatus({
                firmware_present: false,
            }),
        ).toEqual('none');

        expect(
            // @ts-expect-error, incomplete Features
            getFirmwareStatus({
                major_version: 1,
                bootloader_mode: true,
            }),
        ).toEqual('unknown');
    });
});
