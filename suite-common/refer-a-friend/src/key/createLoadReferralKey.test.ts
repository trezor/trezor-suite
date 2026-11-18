import { type UnknownAction } from '@reduxjs/toolkit';

import {
    type DecryptParams,
    type DecryptionError,
    DecryptionFailed,
    type EncryptableBranded,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { asWalletDescriptor } from '@trezor/device-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import { type LoadReferralKeyDeps, createLoadReferralKey } from './createLoadReferralKey';
import { createReferralKeySessionCache } from './createReferralKeySessionCache';
import { referAFriendActions } from '../referAFriendSlice';
import { type ReferralKey, getReferralKeyFromCipheredValue } from '../referralKey';

const WALLET_DESCRIPTOR = asWalletDescriptor('standard');
const referralKey = getReferralKeyFromCipheredValue(
    '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
);
const encryptedReferralKey = asEncryptedHex<ReferralKey>('encrypted-referral-key');

type CreateDepsParams = {
    storedKey: typeof encryptedReferralKey | null;
    decryptResult?: Result<ReferralKey, DecryptionError>;
};

// The generic PlatformEncryption contract cannot be mocked by `createMockDeps`.
const createDeps = ({ storedKey, decryptResult }: CreateDepsParams) => {
    const actions: UnknownAction[] = [];
    const decryptedValues: unknown[] = [];
    const deps: LoadReferralKeyDeps = {
        dispatch: action => {
            actions.push(action);

            return action;
        },
        getEncryptedReferralKey: () => storedKey,
        platformEncryption: {
            encrypt: () => {
                throw new Error('Not expected!');
            },
            decrypt: <T extends EncryptableBranded>({ value }: DecryptParams<T>) => {
                decryptedValues.push(value);

                if (decryptResult === undefined) {
                    throw new Error('Not expected!');
                }

                return Promise.resolve(decryptResult as Result<T, DecryptionError>);
            },
        },
        referralKeySessionCache: createReferralKeySessionCache(),
    };

    return { deps, actions, decryptedValues };
};

describe(createLoadReferralKey.name, () => {
    it('returns the key from the session cache without decrypting', async () => {
        const { deps, decryptedValues } = createDeps({ storedKey: encryptedReferralKey });
        deps.referralKeySessionCache.set(WALLET_DESCRIPTOR, referralKey);

        expect(await createLoadReferralKey(deps)({ walletDescriptor: WALLET_DESCRIPTOR })).toBe(
            referralKey,
        );
        expect(decryptedValues).toEqual([]);
    });

    it('returns null when no key is stored', async () => {
        const { deps } = createDeps({ storedKey: null });

        expect(
            await createLoadReferralKey(deps)({ walletDescriptor: WALLET_DESCRIPTOR }),
        ).toBeNull();
    });

    it('decrypts the stored key on demand', async () => {
        const { deps, decryptedValues } = createDeps({
            storedKey: encryptedReferralKey,
            decryptResult: ok(referralKey),
        });

        expect(await createLoadReferralKey(deps)({ walletDescriptor: WALLET_DESCRIPTOR })).toBe(
            referralKey,
        );
        expect(decryptedValues).toEqual([encryptedReferralKey]);
    });

    it('purges an undecryptable key', async () => {
        const { deps, actions } = createDeps({
            storedKey: encryptedReferralKey,
            decryptResult: err(DecryptionFailed()),
        });

        expect(
            await createLoadReferralKey(deps)({ walletDescriptor: WALLET_DESCRIPTOR }),
        ).toBeNull();
        expect(actions).toEqual([
            referAFriendActions.setEncryptedReferralKey({
                walletDescriptor: WALLET_DESCRIPTOR,
                encryptedKey: null,
            }),
        ]);
    });
});
