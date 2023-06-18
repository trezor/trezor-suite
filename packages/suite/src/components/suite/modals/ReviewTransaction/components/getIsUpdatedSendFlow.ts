import { TrezorDevice } from 'src/types/suite/index';
import { getFirmwareVersion } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

export const getIsUpdatedSendFlow = (device: TrezorDevice) => {
    const firmwareVersion = getFirmwareVersion(device);

    const isWithUpdatedFlow = versionUtils.isNewerOrEqual(firmwareVersion, '2.6.0');

    return isWithUpdatedFlow;
};
