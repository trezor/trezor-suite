import { getReleases, parseFirmware, getFirmwareStatus } from '../firmwareInfo';
import * as releases2 from '@trezor/connect-common/files/firmware/2/releases.json';

describe('data/firmwareInfo', () => {
    beforeEach(() => {
        parseFirmware(releases2, 2);
    });

    test('getReleases', () => {
        expect(getReleases(2)[0]).toMatchObject({
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
