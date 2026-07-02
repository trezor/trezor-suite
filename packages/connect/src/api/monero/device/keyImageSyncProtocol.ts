// The moneroKeyImageSync device protocol (ExportInit → SyncStep → SyncFinal), extracted so both the
// moneroKeyImageSync method and the send orchestration export key images the same way. Faithful
// relocation of the original method body; validated on a device (cannot be unit-tested headlessly).
//
// The returned key images are encrypted under the final `enc_key`; decrypt them with decryptKeyImages
// before use.
import { keccak_256 } from '@noble/hashes/sha3.js';

import type {
    MoneroExportedKeyImage,
    MoneroKeyImageSyncResult,
    PROTO,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { DeviceCommands } from '../../../device/DeviceCommands';

type Commands = ReturnType<typeof DeviceCommands>;

export interface KeyImageSyncParams {
    address_n: number[];
    network_type: PROTO.MoneroNetworkType;
    subs: PROTO.MoneroSubAddressIndicesList[];
    tdis: PROTO.MoneroTransferDetails[];
}

// LEB128 varint, matching the device's hashing of internal_output_index.
const encodeVarint = (value: number): Uint8Array => {
    const bytes: number[] = [];
    let n = value;
    while (n >= 0x80) {
        bytes.push((n & 0x7f) | 0x80);
        n >>= 7;
    }
    bytes.push(n & 0x7f);

    return new Uint8Array(bytes);
};

// Hash of all transfer details the device checks against: keccak(per-tdi keccak digests).
const hashTransferDetails = (tdis: PROTO.MoneroTransferDetails[]): Uint8Array => {
    const final = keccak_256.create();
    for (const tdi of tdis) {
        const kck = keccak_256.create();
        kck.update(tdi.out_key);
        kck.update(tdi.tx_pub_key);
        if (tdi.additional_tx_pub_keys && tdi.additional_tx_pub_keys.length > 0) {
            for (const key of tdi.additional_tx_pub_keys) {
                kck.update(key);
            }
        }
        kck.update(encodeVarint(tdi.internal_output_index));
        final.update(kck.digest());
    }

    return final.digest();
};

export const runMoneroKeyImageSync = async (
    commands: Commands,
    params: KeyImageSyncParams,
): Promise<MoneroKeyImageSyncResult> => {
    // Step 1: Init.
    await commands.typedCall('MoneroKeyImageExportInitRequest', 'MoneroKeyImageExportInitAck', {
        num: params.tdis.length,
        hash: hashTransferDetails(params.tdis),
        address_n: params.address_n,
        network_type: params.network_type,
        subs: params.subs,
    });

    // Step 2: Sync — the device processes all transfer details and returns the encrypted key images.
    const stepResponse = await commands.typedCall(
        'MoneroKeyImageSyncStepRequest',
        'MoneroKeyImageSyncStepAck',
        { tdis: params.tdis },
    );

    // Step 3: Finalize — the device returns the key under which the key images are encrypted.
    const finalResponse = await commands.typedCall(
        'MoneroKeyImageSyncFinalRequest',
        'MoneroKeyImageSyncFinalAck',
        {},
    );
    const encKey = finalResponse.message.enc_key;
    if (!encKey) {
        throw ERRORS.TypedError('Runtime', 'Device did not return encryption key for key images');
    }

    const key_images: MoneroExportedKeyImage[] = stepResponse.message.kis.map(ki => ({
        iv: ki.iv || '',
        key_image: ki.blob || '',
    }));

    return { key_images, signature: encKey };
};
