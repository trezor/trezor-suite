import base58check from 'bs58check';
import crypto from 'crypto';

import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { DEVICE_MODULE_PREFIX, deviceActions } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

const ENABLE_LABELING_PATH = "m/10015'/0'";
const ENABLE_LABELING_KEY = 'Enable labeling?';
const ENABLE_LABELING_VALUE = 'fedcba98765432100123456789abcdeffedcba98765432100123456789abcdef';

const CONFIG = {
    path: ENABLE_LABELING_PATH,
    key: ENABLE_LABELING_KEY,
    value: ENABLE_LABELING_VALUE,
    encrypt: true,
    askOnEncrypt: false,
    askOnDecrypt: false,
};

const deriveHmac = (metadataKey: string) => {
    const hmac = crypto.createHmac('sha512', metadataKey);
    const buf = Buffer.from('0123456789abcdeffedcba9876543210', 'hex');
    hmac.update(buf);

    return hmac.digest();
};

export const deriveAesKey = (metadataKey: string) => {
    const hash = deriveHmac(metadataKey);
    if (hash.length !== 64 && Buffer.byteLength(hash) !== 64) {
        throw new Error(
            `Strange buffer length when deriving account hmac ${hash.length} ; ${Buffer.byteLength(
                hash,
            )}`,
        );
    }
    const secondHalf = hash.subarray(32, 64);

    return secondHalf.toString('hex');
};

export const deriveMetadataKey = (masterKey: string, xpub: string) => {
    const hmac = crypto.createHmac('sha256', Buffer.from(masterKey, 'hex'));
    hmac.update(xpub);
    const hash = hmac.digest();

    return base58check.encode(hash);
};

type InitCipherKeyThunkParams = {
    device: TrezorDevice;
};

export const initCipherKeyThunk = createThunk<void, InitCipherKeyThunkParams, void>(
    `${DEVICE_MODULE_PREFIX}/initCipherKeyThunk`,
    async ({ device }, { dispatch }) => {
        if (device.state?.staticSessionId === undefined) {
            return;
        }

        const result = await TrezorConnect.cipherKeyValue({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            ...CONFIG,
        });

        console.log('____initCipherKeyThunk', result);

        if (result.success) {
            const [stateAddress] = device.state.staticSessionId.split('@'); // address@device_id:instance
            const metaKey = deriveMetadataKey(result.payload.value, stateAddress);
            const aesKey = deriveAesKey(metaKey);

            dispatch(deviceActions.setLocalFirstStorageSecret({ device, secret: aesKey }));
        }
    },
);
