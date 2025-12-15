import {
    type AppOwner,
    type Owner,
    OwnerEncryptionKey,
    OwnerIdBytes,
    OwnerSecret,
    OwnerWriteKey,
    createSlip21,
    hexToBytes,
    ok,
    ownerIdBytesToOwnerId,
    ownerSecretToMnemonic,
} from '@evolu/common';

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
const createAppOwnerFromTrezorNode = (secret: OwnerSecret) => {
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

type CreateEvoluOwnerFromTrezorDataParam = {
    data: string;
};

export const createEvoluAppOwnerFromTrezorData = ({
    data,
}: CreateEvoluOwnerFromTrezorDataParam) => {
    const ownerResult = OwnerSecret.from(
        hexToBytes(data)
            // Get only [0, 32] Slip21 Node Data (Node Key [32, 64] is irrelevant for Evolu)
            .slice(0, 32),
    );

    if (!ownerResult.ok) {
        return ownerResult;
    }

    return createAppOwnerFromTrezorNode(ownerResult.value);
};
