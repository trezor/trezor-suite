import { type DeviceIdentity, asDeviceUniquePath } from '@trezor/connect';
import { type GetTrezorConnect } from '@trezor/connect-common';

import {
    type RetrieveReferralKeyFromDeviceParams,
    createRetrieveReferralKeyFromDevice,
} from './createRetrieveReferralKeyFromDevice';
import { getReferralKeyFromCipheredValue } from '../referralKey';
import { REFERRAL_KEY_CIPHER_PARAMS } from '../referralKeyConstants';

const CIPHERED_VALUE = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

const standardWallet: RetrieveReferralKeyFromDeviceParams['device'] = {
    path: asDeviceUniquePath('1/2/3'),
    state: { staticSessionId: 'standard@device:1' },
    instance: 1,
    connected: true,
};

type CipherKeyValue = ReturnType<GetTrezorConnect<'cipherKeyValue'>>['cipherKeyValue'];

type CipherKeyValueResponse =
    | { device: DeviceIdentity; success: true; payload: { value: string } }
    | { success: false; error: { message: string } };

// `cipherKeyValue` is overloaded (single and bundle), a mock can implement only the single call.
const createGetTrezorConnect = (
    response: CipherKeyValueResponse,
): { getTrezorConnect: GetTrezorConnect<'cipherKeyValue'>; cipherKeyValue: jest.Mock } => {
    const cipherKeyValue = jest.fn(() => Promise.resolve(response));

    return {
        getTrezorConnect: () => ({ cipherKeyValue: cipherKeyValue as unknown as CipherKeyValue }),
        cipherKeyValue,
    };
};

const device = { path: standardWallet.path } as DeviceIdentity;

describe(createRetrieveReferralKeyFromDevice.name, () => {
    it('derives the key on the given standard wallet with an empty passphrase', async () => {
        const { getTrezorConnect, cipherKeyValue } = createGetTrezorConnect({
            device,
            success: true,
            payload: { value: CIPHERED_VALUE },
        });

        const result = await createRetrieveReferralKeyFromDevice({ getTrezorConnect })({
            device: standardWallet,
        });

        expect(result).toEqual({
            success: true,
            payload: getReferralKeyFromCipheredValue(CIPHERED_VALUE),
        });
        expect(cipherKeyValue).toHaveBeenCalledWith({
            device: {
                path: standardWallet.path,
                state: standardWallet.state,
                instance: 1,
                useEmptyPassphrase: true,
            },
            ...REFERRAL_KEY_CIPHER_PARAMS,
        });
    });

    it('does not call Connect for a disconnected device', async () => {
        const getTrezorConnect = jest.fn();

        const result = await createRetrieveReferralKeyFromDevice({ getTrezorConnect })({
            device: { ...standardWallet, connected: false },
        });

        expect(!result.success && result.error.type).toBe('DeviceNotConnectedError');
        expect(getTrezorConnect).not.toHaveBeenCalled();
    });

    it.each([
        ['Action cancelled by user', 'DeviceCancelled'],
        ['Invalid state', 'DeviceError'],
    ])('maps Connect error %p to %p', async (message, expectedType) => {
        const { getTrezorConnect } = createGetTrezorConnect({
            success: false,
            error: { message },
        });

        const result = await createRetrieveReferralKeyFromDevice({ getTrezorConnect })({
            device: standardWallet,
        });

        expect(!result.success && result.error.type).toBe(expectedType);
    });
});
