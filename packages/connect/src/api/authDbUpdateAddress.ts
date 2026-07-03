import { bytesToHex } from '@noble/hashes/utils.js';

import {
    entryToValueBytes,
    generateMerkleProof,
    generateNonMembershipProof,
} from '@trezor/authdb-merkle-tree';
import type { AddressEntry, MethodPermission } from '@trezor/connect-common';
import { AuthDbUpdateAddressSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import * as settingsStore from '../data/settingsStore';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

export default class AuthDbUpdateAddress extends AbstractMethod<
    'authDbUpdateAddress',
    AuthDbUpdateAddressSchema
> {
    constructor(message: MethodMessage<'authDbUpdateAddress'>) {
        const { payload } = message;
        Assert(AuthDbUpdateAddressSchema, payload);

        const params = {
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            metadata: payload.metadata,
        };

        super(message, params);
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get info() {
        return 'Update AuthDB address entry';
    }

    async run() {
        const provider = settingsStore.get('addressLookupProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbUpdateAddress requires addressLookupProvider to be set via TrezorConnect.init()',
            );
        }

        const { address, networkSymbol, metadata } = this.params;

        const [rows, oldEntry] = await Promise.all([
            provider.getAllEntries(),
            provider.lookup(address, networkSymbol),
        ]);

        const newEntry: AddressEntry = { metadata, counter: (oldEntry?.counter ?? 0) + 1 };
        const isInsert = oldEntry === null;

        const oldValueHex = isInsert ? '' : bytesToHex(entryToValueBytes(networkSymbol, oldEntry));
        const newValueHex = bytesToHex(entryToValueBytes(networkSymbol, newEntry));

        const nonMembership = isInsert
            ? generateNonMembershipProof(rows, address, networkSymbol)
            : null;
        const proof = isInsert
            ? (nonMembership?.proof ?? [])
            : generateMerkleProof(rows, address, networkSymbol);

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthDbUpdateLeaf', 'AuthDbUpdateLeafResponse', {
            address: utf8Hex(address),
            old_value: oldValueHex,
            new_value: newValueHex,
            proof,
            ...(nonMembership?.witnessAddress !== null &&
                nonMembership?.witnessAddress !== undefined && {
                    witness_address: utf8Hex(nonMembership.witnessAddress),
                    witness_value: bytesToHex(nonMembership.witnessValue!),
                }),
        });

        await provider.upsert(address, networkSymbol, newEntry);
        if (response.message.new_root !== undefined) {
            await provider.setTreeState({
                root: response.message.new_root,
                counter: response.message.counter,
            });
        }

        return {
            counter: response.message.counter,
            root: response.message.new_root ?? '',
        };
    }
}
