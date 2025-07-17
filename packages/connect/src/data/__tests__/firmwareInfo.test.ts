import { getFirmwareStatus } from '../firmwareInfo';

describe('data/firmwareInfo', () => {
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
