import {
    DeviceCancelledErr,
    DeviceError,
    DeviceNotConnectedError,
    isCanceledErrorMessage,
} from '@suite-common/device';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { type GetTrezorConnectDep } from '@trezor/connect-common';
import { type Result, err, ok } from '@trezor/type-utils';

import { type ReferralDeviceError } from '../referAFriendTypes';
import { type ReferralKey, getReferralKeyFromCipheredValue } from '../referralKey';
import { REFERRAL_KEY_CIPHER_PARAMS } from '../referralKeyConstants';

export type RetrieveReferralKeyFromDeviceDeps = GetTrezorConnectDep<'cipherKeyValue'>;

export type RetrieveReferralKeyFromDeviceParams = {
    // Must be the standard (no passphrase) wallet, see `selectReferralKeyDerivationDevice`.
    device: Pick<TrezorDeviceWithState, 'path' | 'state' | 'instance' | 'connected'>;
};

export type RetrieveReferralKeyFromDevice = (
    params: RetrieveReferralKeyFromDeviceParams,
) => Promise<Result<ReferralKey, ReferralDeviceError>>;

export type RetrieveReferralKeyFromDeviceDep = {
    retrieveReferralKeyFromDevice: RetrieveReferralKeyFromDevice;
};

export const createRetrieveReferralKeyFromDevice =
    (deps: RetrieveReferralKeyFromDeviceDeps): RetrieveReferralKeyFromDevice =>
    async ({ device }) => {
        if (!device.connected) {
            return err(DeviceNotConnectedError('Device not connected: retrieveReferralKey'));
        }

        // Passing the standard wallet's state makes Connect verify that the call really runs on
        // the standard wallet, even when the passphrase is entered on the device.
        const result = await deps.getTrezorConnect().cipherKeyValue({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
                useEmptyPassphrase: true,
            },
            ...REFERRAL_KEY_CIPHER_PARAMS,
        });

        if (result.success) {
            return ok(getReferralKeyFromCipheredValue(result.payload.value));
        }

        if (isCanceledErrorMessage(result.error.message)) {
            return err(DeviceCancelledErr());
        }

        return err(DeviceError(result.error.message));
    };
