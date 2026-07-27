import { type TranslationKey } from '@suite/intl';
import { type getStatus } from '@suite-common/suite-utils';

export const getDeviceResolveStatusCTAMessage = (
    deviceStatus: ReturnType<typeof getStatus>,
): TranslationKey => {
    switch (deviceStatus) {
        case 'bootloader':
            return 'TR_SELECT_DEVICE_SHORT';
        case 'initialize':
            return 'TR_CONTINUE_SETUP';
        case 'device-thp-locked':
            return 'TR_TRY_AGAIN';
        case 'firmware-required':
        case 'firmware-corrupted':
            return 'TR_JUST_INSTALL';
        case 'was-used-in-other-window':
        case 'used-in-other-window':
        case 'unacquired':
            return 'TR_USE_HERE';
        default:
            return 'TR_SOLVE_ISSUE';
    }
};
