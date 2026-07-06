import { hexToBytes } from '@noble/hashes/utils.js';

import type { MoneroKeyImageSyncResult, PermissionRequest } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { HD_HARDENED_PATH_PART } from '@trezor/crypto-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import { runMoneroKeyImageSync } from '../device/keyImageSyncProtocol';

type Params = {
    address_n: number[];
    network_type: PROTO.MoneroNetworkType;
    subs: PROTO.MoneroSubAddressIndicesList[];
    tdis: PROTO.MoneroTransferDetails[];
};

export default class MoneroKeyImageSyncMethod extends AbstractMethod<'moneroKeyImageSync', Params> {
    constructor(message: MethodMessage<'moneroKeyImageSync'>) {
        const { payload } = message;
        const path = validatePath(payload.path, 3);

        // require all path components to be hardened
        const allHardened = path.every(component => (component & HD_HARDENED_PATH_PART) !== 0);
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

        const params = {
            address_n: path,
            network_type: payload.networkType || PROTO.MoneroNetworkType.MAINNET,
            subs: payload.subs || [],
            tdis,
        };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Monero'];
        this.requiredFirmwareCoins = [getMiscNetwork('Monero')];
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('read_account_info', this.requiredFirmwareCoins);
    }

    get info() {
        return 'Export Monero key images for spent output tracking';
    }

    run(): Promise<MoneroKeyImageSyncResult> {
        return runMoneroKeyImageSync(this.getDevice().getCommands(), this.params);
    }
}
