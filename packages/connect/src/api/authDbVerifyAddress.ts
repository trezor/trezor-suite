import { bytesToHex } from '@noble/hashes/utils.js';

import {
    entryToValueBytes,
    generateMerkleProof,
    generateNonMembershipProof,
} from '@trezor/authdb-merkle-tree';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbVerifyAddressSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import * as settingsStore from '../data/settingsStore';

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
        };

        super(message, params);
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
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

        const { address, networkSymbol } = this.params;

        const [rows, entry] = await Promise.all([
            provider.getAllEntries(),
            provider.lookup(address, networkSymbol),
        ]);

        const cmd = this.getDevice().getCommands();
        const isMember = entry !== null;

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
