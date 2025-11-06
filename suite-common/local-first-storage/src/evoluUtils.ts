import {
    AppOwner,
    Owner,
    OwnerEncryptionKey,
    OwnerIdBytes,
    OwnerSecret,
    OwnerWriteKey,
    Query,
    createSlip21,
    ok,
    ownerIdBytesToOwnerId,
    ownerSecretToMnemonic,
} from '@evolu/common';

export type UnwrapQuery<T> = T extends Query<infer U> ? U : T;

const createOwnerFromTrezorNode = (secret: OwnerSecret) => {
    const ownerIdBytes = OwnerIdBytes.from(createSlip21(secret, ['OwnerIdBytes']).slice(0, 16));
    if (!ownerIdBytes.ok) {
        return ownerIdBytes;
    }

    const ownerEncryptionKey = OwnerEncryptionKey.from(
        createSlip21(secret, ['OwnerEncryptionKey']),
    );
    if (!ownerEncryptionKey.ok) {
        return ownerEncryptionKey;
    }

    const ownerWriteKey = OwnerWriteKey.from(createSlip21(secret, ['OwnerWriteKey']).slice(0, 16));
    if (!ownerWriteKey.ok) {
        return ownerWriteKey;
    }

    return ok({
        id: ownerIdBytesToOwnerId(ownerIdBytes.value),
        encryptionKey: ownerEncryptionKey.value,
        writeKey: ownerWriteKey.value,
    } satisfies Owner);
};

/**
 * Original Evolu implementation of `createAppOwner` uses path `['Evolu', 'OwnerIdBytes']`,
 * but the Trezor Device already return a Slip21 node at path `['TREZOR', 'Evolu']`.
 *
 * So we need to have custom implementation to not duplicate `'Evolu'` in the Slip21 path.
 *
 * @see: https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/evolu/get_node.py#L6
 */
export const createAppOwnerFromTrezorNode = (secret: OwnerSecret) => {
    const owner = createOwnerFromTrezorNode(secret);

    if (!owner.ok) {
        return owner;
    }

    return ok({
        type: 'AppOwner',
        mnemonic: ownerSecretToMnemonic(secret),
        ...owner.value,
    } satisfies AppOwner);
};
