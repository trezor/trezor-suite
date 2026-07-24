import { type TrezorDevice } from '@suite-common/suite-types';
import { type StablecoinYieldTranslationKey } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { getYieldErrorTranslationKey } from 'src/actions/wallet/stablecoin-yield/signingHelpers';

export type EnsureDeviceSessionResult =
    | { success: true }
    | { success: false; error?: StablecoinYieldTranslationKey };

export const ensureDeviceSession = async (
    device: TrezorDevice | undefined,
): Promise<EnsureDeviceSessionResult> => {
    if (!device?.state?.staticSessionId) {
        return { success: false, error: 'TR_EARN_YIELD_ERROR_GENERIC' };
    }

    const response = await TrezorConnect.getDeviceState({
        device: {
            path: device.path,
            instance: device.instance,
            state: { staticSessionId: device.state.staticSessionId },
            useEmptyPassphrase: device.useEmptyPassphrase,
        },
    });

    if (response.success) {
        return { success: true };
    }

    const { code } = response.error;

    if (code === 'Failure_ActionCancelled' || code === 'Method_Cancel') {
        return { success: false };
    }

    return {
        success: false,
        error: getYieldErrorTranslationKey(new Error(response.error.message, { cause: code })),
    };
};
