import { TrezorDevice } from 'src/types/suite';
import { getFormattedFingerprint, validateFirmware } from '..';
import { DeviceModelInternal } from '@trezor/connect';

describe('getFormattedFingerprint', () => {
    it('should return a formatted fingerprint', () => {
        const fingerprint = '123456789a123456789b123456789c123456789d123456789012345678901234';
        const expectedResult =
            '123456789A123456\n789B123456789C12\n3456789D12345678\n9012345678901234';

        const result = getFormattedFingerprint(fingerprint);

        expect(result).toEqual(expectedResult);
    });
});

const getT1V2FW = () => {
    const fw = new ArrayBuffer(20);
    const firmwareView = new Uint8Array(fw);
    firmwareView[0] = 84;
    firmwareView[1] = 82;
    firmwareView[2] = 90;
    firmwareView[3] = 70;

    return fw;
};

describe('validateFirmware', () => {
    it('should return TR_UNKNOWN_DEVICE if device is undefined', () => {
        const fw = new ArrayBuffer(20);
        expect(validateFirmware(fw, undefined)).toBe('TR_UNKNOWN_DEVICE');
    });

    it('should return TR_FIRMWARE_VALIDATION_UNRECOGNIZED_FORMAT if firmware format is unrecognized', () => {
        const fw = new ArrayBuffer(20);

        const device = { features: { internal_model: DeviceModelInternal.T2T1 } } as TrezorDevice;

        expect(validateFirmware(fw, device)).toBe('TR_FIRMWARE_VALIDATION_UNRECOGNIZED_FORMAT');
    });

    it('should return TR_FIRMWARE_VALIDATION_UNMATCHING_DEVICE if firmware format does not match the device model', () => {
        const fw = getT1V2FW();

        const device = { features: { internal_model: DeviceModelInternal.T2B1 } } as TrezorDevice;

        expect(validateFirmware(fw, device)).toBe('TR_FIRMWARE_VALIDATION_UNMATCHING_DEVICE');
    });

    it('should return TR_FIRMWARE_VALIDATION_T1_V2 if firmware format does not match the FW version', () => {
        const fw = getT1V2FW();

        const device = {
            features: {
                internal_model: DeviceModelInternal.T1B1,
                major_version: 1,
                minor_version: 6,
                patch_version: 0,
            },
        } as TrezorDevice;

        expect(validateFirmware(fw, device)).toBe('TR_FIRMWARE_VALIDATION_T1_V2');
    });

    it('should pass for matching FW format and model', () => {
        const fw = getT1V2FW();

        const device = {
            features: {
                internal_model: DeviceModelInternal.T1B1,
                major_version: 1,
                minor_version: 8,
                patch_version: 3,
            },
        } as TrezorDevice;

        expect(validateFirmware(fw, device)).toBe(undefined);
    });
});
