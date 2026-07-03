import { bytesToHex } from '@noble/hashes/utils.js';

import {
    computeMerkleRoot,
    entryToValueBytes,
    evaluateProof,
    generateMerkleProof,
    generateNonMembershipProof,
} from '@trezor/authdb';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbVerifyAddressSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

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
        const provider = settingsStore.get('authLabelLookupProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbVerifyAddress requires authLabelLookupProvider to be set via TrezorConnect.init()',
            );
        }

        const { address, networkSymbol, walletId } = this.params;

        const [rows, entry] = await Promise.all([
            provider.getAllEntries(),
            provider.lookup(address, networkSymbol),
        ]);

        const isMember = entry !== null;

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

            return {
                isMember,
                valid: computedRoot === localRoot,
                counter: entry?.counter ?? 0,
            };
        }

        const cmd = this.getDevice().getCommands();

        const response = isMember
            ? await cmd.typedCall('AuthDbLookup', 'AuthDbLookupResponse', {
                  address: utf8Hex(address),
                  value: bytesToHex(entryToValueBytes(networkSymbol, entry)),
                  proof: generateMerkleProof(rows, address, networkSymbol),
              })
            : await (() => {
                  const nonMembership = generateNonMembershipProof(rows, address, networkSymbol);

                  return cmd.typedCall('AuthDbLookup', 'AuthDbLookupResponse', {
                      address: utf8Hex(address),
                      proof: nonMembership.proof,
                      ...(nonMembership.witnessAddress !== null && {
                          witness_address: utf8Hex(nonMembership.witnessAddress),
                          witness_value: bytesToHex(nonMembership.witnessValue!),
                      }),
                  });
              })();

        return {
            isMember,
            valid: response.message.valid,
            counter: response.message.counter,
            identifier: response.message.identifier,
        };
    }
}
