import { keccak_256 } from '@noble/hashes/sha3.js';
import { hexToBytes } from '@noble/hashes/utils.js';

import { ERRORS } from '@trezor/connect-common/src/constants';

import { PROTO } from '../../../constants';
import { AbstractMethod, MethodPermission, Payload } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import type { MoneroExportedKeyImage, MoneroKeyImageSyncResult } from '../../../types/api/monero';
import { HD_HARDENED, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

// Encode unsigned integer as varint (LEB128 format)
function encodeVarint(n: number): Uint8Array {
    const bytes: number[] = [];
    while (n >= 0x80) {
        bytes.push((n & 0x7f) | 0x80);
        n >>= 7;
    }
    bytes.push(n & 0x7f);

    return new Uint8Array(bytes);
}

type Params = {
    address_n: number[];
    network_type: PROTO.MoneroNetworkType;
    subs: PROTO.MoneroSubAddressIndicesList[];
    tdis: PROTO.MoneroTransferDetails[];
};

export default class MoneroKeyImageSyncMethod extends AbstractMethod<'moneroKeyImageSync', Params> {
    constructor(message: { id?: number; payload: Payload<'moneroKeyImageSync'> }) {
        super(message);
        this.requiredDeviceCapabilities = ['Capability_Monero'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Monero'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { payload } = this;
        const path = validatePath(payload.path, 3);

        // require all path components to be hardened
        const allHardened = path.every(component => (component & HD_HARDENED) !== 0);
        if (!allHardened) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Monero requires all path components to be hardened. Use m/44'/128'/0' format.`,
            );
        }

        // Validate tdis array
        if (!payload.tdis || payload.tdis.length === 0) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'tdis (transfer details) array is required and cannot be empty',
            );
        }

        // Convert tdis to protobuf format
        const tdis = payload.tdis.map((tdi, index) => {
            // Validate key lengths - Monero keys are 32 bytes (64 hex chars)
            if (tdi.out_key.length !== 64) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    `Invalid out_key length at index ${index}: expected 64 hex characters, got ${tdi.out_key.length}`,
                );
            }
            if (tdi.tx_pub_key.length !== 64) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    `Invalid tx_pub_key length at index ${index}: expected 64 hex characters, got ${tdi.tx_pub_key.length}`,
                );
            }

            // Validate additional_tx_pub_keys if present
            let additionalKeys: string[] = [];
            const addlKeys = tdi.additional_tx_pub_keys;
            if (addlKeys) {
                if (Array.isArray(addlKeys)) {
                    additionalKeys = addlKeys;
                } else if (typeof addlKeys === 'string') {
                    const trimmed = addlKeys.trim();
                    if (trimmed) {
                        additionalKeys = trimmed.split(',').map((k: string) => k.trim());
                    }
                }
            }

            additionalKeys.forEach((key: string, keyIndex: number) => {
                if (key && key.length !== 64) {
                    throw ERRORS.TypedError(
                        'Method_InvalidParameter',
                        `Invalid additional_tx_pub_keys[${keyIndex}] length at tdi index ${index}: expected 64 hex characters, got ${key.length}`,
                    );
                }
            });

            return {
                out_key: hexToBytes(tdi.out_key),
                tx_pub_key: hexToBytes(tdi.tx_pub_key),
                additional_tx_pub_keys: additionalKeys.map(k => hexToBytes(k)),
                internal_output_index: tdi.internal_output_index,
                sub_addr_major: tdi.sub_addr_major,
                sub_addr_minor: tdi.sub_addr_minor,
            };
        });

        this.params = {
            address_n: path,
            network_type: payload.networkType || PROTO.MoneroNetworkType.MAINNET,
            subs: payload.subs || [],
            tdis,
        };
    }

    get info() {
        return 'Export Monero key images for spent output tracking';
    }

    async run(): Promise<MoneroKeyImageSyncResult> {
        const cmd = this.getDevice().getCommands();

        // Compute hash of all tdis for verification
        const tdHashes: Uint8Array[] = [];
        for (const tdi of this.params.tdis) {
            // Compute hash for this transfer detail
            const kck = keccak_256.create();

            // Update with out_key (32 bytes)
            kck.update(tdi.out_key);

            // Update with tx_pub_key (32 bytes)
            kck.update(tdi.tx_pub_key);

            // Update with additional_tx_pub_keys if present
            if (tdi.additional_tx_pub_keys && tdi.additional_tx_pub_keys.length > 0) {
                for (const addKey of tdi.additional_tx_pub_keys) {
                    kck.update(addKey);
                }
            }

            // Update with internal_output_index as varint
            const indexVarint = encodeVarint(tdi.internal_output_index);
            kck.update(indexVarint);

            tdHashes.push(kck.digest());
        }

        // Compute final hash as keccak(hash1 + hash2 + ... + hashN)
        const finalKck = keccak_256.create();
        for (const hash of tdHashes) {
            finalKck.update(hash);
        }
        const hashBytes = finalKck.digest();

        // Step 1: Initialize
        const numOutputs = this.params.tdis.length;
        await cmd.typedCall('MoneroKeyImageExportInitRequest', 'MoneroKeyImageExportInitAck', {
            num: numOutputs,
            hash: hashBytes,
            address_n: this.params.address_n,
            network_type: this.params.network_type,
            subs: this.params.subs,
        });

        // Step 2: Process batches (device may handle in chunks)
        const allKeyImages: PROTO.MoneroExportedKeyImage[] = [];

        // Send all tdis in one step (device will handle internally)
        const stepResponse = await cmd.typedCall(
            'MoneroKeyImageSyncStepRequest',
            'MoneroKeyImageSyncStepAck',
            {
                tdis: this.params.tdis,
            },
        );

        allKeyImages.push(...stepResponse.message.kis);

        // Step 3: Finalize
        const finalResponse = await cmd.typedCall(
            'MoneroKeyImageSyncFinalRequest',
            'MoneroKeyImageSyncFinalAck',
            {},
        );

        const encKey = finalResponse.message.enc_key;
        if (!encKey) {
            throw ERRORS.TypedError(
                'Runtime',
                'Device did not return encryption key for key images',
            );
        }

        // Decrypt and format key images
        const keyImages: MoneroExportedKeyImage[] = allKeyImages.map(ki => ({
            iv: ki.iv || '',
            key_image: ki.blob || '',
        }));

        return {
            key_images: keyImages,
            signature: encKey,
        };
    }
}
