import { bytesToHex } from '@noble/hashes/utils.js';

import { entryToValueBytes } from '@trezor/authdb';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbApproveAddressSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

export default class AuthDbApproveAddress extends AbstractMethod<
    'authDbApproveAddress',
    AuthDbApproveAddressSchema
> {
    constructor(message: MethodMessage<'authDbApproveAddress'>) {
        const { payload } = message;
        Assert(AuthDbApproveAddressSchema, payload);

        const params = {
            address: payload.address,
            networkSymbol: payload.networkSymbol,
        };

        super(message, params);
        // Pre-approval is inherently a device-signing operation — there is no offline mode.
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Pre-approve the auth-label entry for this address on the device?',
        };
    }

    get info() {
        return 'Pre-approve AuthDB address entry';
    }

    async run() {
        const provider = settingsStore.get('authLabelLookupProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbApproveAddress requires authLabelLookupProvider to be set via TrezorConnect.init()',
            );
        }
        if (!provider.setApproval) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbApproveAddress requires a provider implementing AuthLabelApprovalProvider (setApproval)',
            );
        }

        const { address, networkSymbol } = this.params;

        const entry = await provider.lookup(address, networkSymbol);
        if (entry === null) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbApproveAddress: address not found in the local database — call authDbUpdateAddress first',
            );
        }

        const valueHex = bytesToHex(entryToValueBytes(networkSymbol, entry));

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthDbApprove', 'AuthDbApproveResponse', {
            address: utf8Hex(address),
            value: valueHex,
        });

        const { mac, identifier: deviceId } = response.message;

        await provider.setApproval(address, networkSymbol, mac, deviceId);

        return { mac, deviceId };
    }
}
