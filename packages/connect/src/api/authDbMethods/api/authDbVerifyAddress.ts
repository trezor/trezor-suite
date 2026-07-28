/* eslint-disable no-console -- verbose AuthDB dblookup diagnostics */
import { bytesToHex } from '@noble/hashes/utils.js';

import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbVerifyAddressSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';
import {
    computeMerkleRoot,
    entryToValueBytes,
    evaluateProof,
    generateMerkleProof,
    generateNonMembershipProof,
} from '@trezor/ward';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

export default class AuthDbVerifyAddress extends AbstractMethod<
    'authDbVerifyAddress',
    AuthDbVerifyAddressSchema
> {
    constructor(message: MethodMessage<'authDbVerifyAddress'>) {
        const { payload } = message;
        Assert(AuthDbVerifyAddressSchema, payload);

        const params = {
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            walletId: payload.walletId,
        };

        super(message, params);
        // No `device` supplied means offline mode: verify local consistency (does the
        // proof over the stored entries round-trip to the stored root?) without a device
        // round-trip. This does not confirm authenticity against firmware, only that the
        // local database is internally consistent (see run()).
        this.useDevice = payload.device !== undefined;
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Verify the auth-label entry for this address against the device?',
        };
    }

    get info() {
        return 'Verify AuthDB address entry';
    }

    async run() {
        const provider = settingsStore.get('wardDataProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbVerifyAddress requires wardDataProvider to be set via TrezorConnect.init()',
            );
        }

        const { address, networkSymbol, walletId } = this.params;
        // Verbose diagnostics — prefixed so they're greppable in connect-cli output.
        const vlog = (...m: unknown[]) => console.log('[authDbVerifyAddress]', ...m);

        const [rows, entry] = await Promise.all([
            provider.getAllEntries(walletId),
            provider.lookup(walletId, address, networkSymbol),
        ]);

        const isMember = entry !== null;

        vlog('ENTER', {
            walletId,
            address,
            networkSymbol,
            mode: this.useDevice ? 'device' : 'offline',
            query: isMember ? 'membership' : 'non-membership',
            localRows: rows.length,
            counter: entry?.counter ?? null,
        });

        // Current locally-stored root before this operation (mirrors the device's own
        // stored_root log), so host and device roots can be compared side by side.
        const currentTreeState = await provider.getTreeState(walletId);
        vlog('current local root (before op)', {
            root: currentTreeState?.root ?? '(none — empty tree)',
            counter: currentTreeState?.counter ?? 0,
        });

        if (!this.useDevice) {
            const treeState = await provider.getTreeState(walletId);
            const localRoot = treeState?.root ?? computeMerkleRoot(rows);
            const computedRoot = isMember
                ? evaluateProof(
                      address,
                      networkSymbol,
                      entry,
                      generateMerkleProof(rows, address, networkSymbol),
                  )
                : computeMerkleRoot(rows);
            vlog('OFFLINE consistency check', {
                localRoot,
                computedRoot,
                valid: computedRoot === localRoot,
            });

            return {
                isMember,
                valid: computedRoot === localRoot,
                counter: entry?.counter ?? 0,
            };
        }

        const cmd = this.getDevice().getCommands();

        let response;
        if (isMember) {
            const proof = generateMerkleProof(rows, address, networkSymbol);
            vlog('-> WARDLookup (membership, proof from wardDataProvider)', {
                value: bytesToHex(entryToValueBytes(networkSymbol, entry)),
                counter: entry.counter,
                proofLen: proof.length,
                proof,
            });
            response = await cmd.typedCall('WARDLookup', 'WARDLookupAck', {
                address: utf8Hex(address),
                value: bytesToHex(entryToValueBytes(networkSymbol, entry)),
                proof,
                counter: entry.counter,
            });
        } else {
            const nonMembership = generateNonMembershipProof(rows, address, networkSymbol);
            vlog('-> WARDLookup (non-membership, proof from wardDataProvider)', {
                proofLen: nonMembership.proof.length,
                proof: nonMembership.proof,
                witnessAddress: nonMembership.witnessAddress,
                witnessValue: nonMembership.witnessValue
                    ? bytesToHex(nonMembership.witnessValue)
                    : null,
                witnessCounter: nonMembership.witnessCounter ?? null,
            });
            response = await cmd.typedCall('WARDLookup', 'WARDLookupAck', {
                address: utf8Hex(address),
                proof: nonMembership.proof,
                ...(nonMembership.witnessAddress !== null && {
                    witness_address: utf8Hex(nonMembership.witnessAddress),
                    witness_value: bytesToHex(nonMembership.witnessValue!),
                    witness_counter: nonMembership.witnessCounter!,
                }),
            });
        }
        vlog('<- WARDLookupAck', {
            valid: response.message.valid,
            membership: response.message.membership,
            counter: response.message.counter,
            wallet_id: response.message.wallet_id,
        });

        if (response.message.wallet_id !== undefined && response.message.wallet_id !== walletId) {
            vlog('REJECT wallet_id mismatch', {
                deviceWalletId: response.message.wallet_id,
                requestedWalletId: walletId,
            });
            throw ERRORS.TypedError(
                'Runtime',
                `authDbVerifyAddress: device wallet_id (${response.message.wallet_id}) does not match requested walletId (${walletId})`,
            );
        }

        return {
            isMember,
            valid: response.message.valid,
            counter: response.message.counter,
            walletId: response.message.wallet_id,
        };
    }
}
