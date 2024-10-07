import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect from '@trezor/connect';
import { getFwUpdateVersion } from '@suite-common/suite-utils';
import { getFirmwareVersion } from '@trezor/device-utils';
import { TrezorDevice } from '@suite-common/suite-types';

import { FIRMWARE_MODULE_PREFIX } from './firmwareActions';
import { selectFirmware } from './firmwareReducer';
import { getBinFilesBaseUrlThunk } from './getBinFilesBaseUrlThunk';

type CheckFirmwareHashThunkParams = {
    device: TrezorDevice;
};

export const validateFirmwareHashThunk = createThunk<
    { success: 'valid' } | { success: 'invalid'; error: string },
    CheckFirmwareHashThunkParams,
    { rejectValue: { success: 'unable-to-verify'; error: string } }
>(
    `${FIRMWARE_MODULE_PREFIX}/checkFirmwareHashThunk`,
    async ({ device }, { dispatch, getState, rejectWithValue, fulfillWithValue }) => {
        const currentFwVersion = getFirmwareVersion(device);
        const availableFwVersion = getFwUpdateVersion(device);

        if (availableFwVersion === null) {
            return rejectWithValue({
                success: 'unable-to-verify',
                error: 'No available FW version',
            });
        }

        const binFilesBaseUrl = await dispatch(getBinFilesBaseUrlThunk()).unwrap();
        const { useDevkit } = selectFirmware(getState());
        const baseUrl = `${binFilesBaseUrl}${useDevkit ? '/devkit' : ''}`;

        const result = await TrezorConnect.checkFirmwareAuthenticity({
            // For current version of the FW (the one known by the Suite) we dont need to download it
            // and we just link it statically
            baseUrl: currentFwVersion === availableFwVersion ? baseUrl : undefined,
        });

        if (!result.success) {
            return rejectWithValue({ success: 'unable-to-verify', error: result.payload.error });
        }

        return fulfillWithValue(
            result.payload.valid
                ? { success: 'valid' }
                : { success: 'invalid', error: 'Hash does not match!' },
        );
    },
);
