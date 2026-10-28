import { type UnknownAction } from '@reduxjs/toolkit';

import {
    type EncryptParams,
    type EncryptableBranded,
    EncryptionUnavailable,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { err, ok } from '@trezor/type-utils';

import { createReferralKeySessionCache } from './createReferralKeySessionCache';
import { type SaveReferralKeyDeps, createSaveReferralKey } from './createSaveReferralKey';
import { referAFriendActions } from '../referAFriendSlice';
import { getReferralKeyFromCipheredValue } from '../referralKey';

const DEVICE_ID = 'device-1';
const referralKey = getReferralKeyFromCipheredValue(
    '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
);

// The generic PlatformEncryption contract cannot be mocked by `createMockDeps`.
const createDeps = (isEncryptionAvailable: boolean) => {
    const actions: UnknownAction[] = [];
    const deps: SaveReferralKeyDeps = {
        dispatch: action => {
            actions.push(action);

            return action;
        },
        platformEncryption: {
            encrypt: <T extends EncryptableBranded>({ value }: EncryptParams<T>) =>
                Promise.resolve(
                    isEncryptionAvailable
                        ? ok(asEncryptedHex<T>(`${value}-<encrypted>`))
                        : err(EncryptionUnavailable('unavailable')),
                ),
            decrypt: () => {
                throw new Error('Not expected!');
            },
        },
        referralKeySessionCache: createReferralKeySessionCache(),
    };

    return { deps, actions };
};

describe(createSaveReferralKey.name, () => {
    it('stores the encrypted key in the state', async () => {
        const { deps, actions } = createDeps(true);

        await createSaveReferralKey(deps)({ deviceId: DEVICE_ID, referralKey });

        expect(actions).toEqual([
            referAFriendActions.setEncryptedReferralKey({
                deviceId: DEVICE_ID,
                encryptedKey: asEncryptedHex(`${referralKey}-<encrypted>`),
            }),
        ]);
        expect(deps.referralKeySessionCache.get(DEVICE_ID)).toBeNull();
    });

    it('keeps the key only in the session cache when encryption is unavailable', async () => {
        const { deps, actions } = createDeps(false);

        await createSaveReferralKey(deps)({ deviceId: DEVICE_ID, referralKey });

        expect(actions).toEqual([
            referAFriendActions.setEncryptedReferralKey({
                deviceId: DEVICE_ID,
                encryptedKey: null,
            }),
        ]);
        expect(deps.referralKeySessionCache.get(DEVICE_ID)).toBe(referralKey);
    });
});
