import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbFastForwardRootSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

export default class AuthDbFastForwardRoot extends AbstractMethod<
    'authDbFastForwardRoot',
    AuthDbFastForwardRootSchema
> {
    constructor(message: MethodMessage<'authDbFastForwardRoot'>) {
        const { payload } = message;
        Assert(AuthDbFastForwardRootSchema, payload);

        const params = {
            walletId: payload.walletId,
        };

        super(message, params);
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Fast-forward the device to the latest known root for this wallet? Queued entries will not be individually verified.',
        };
    }

    get info() {
        return 'Fast-forward AuthDB root (skip-ahead sync)';
    }

    async run() {
        const provider = settingsStore.get('authLabelLookupProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbFastForwardRoot requires authLabelLookupProvider to be set via TrezorConnect.init()',
            );
        }

        const { walletId } = this.params;

        const treeState = await provider.getTreeState(walletId);
        if (!treeState) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbFastForwardRoot: no stored root for this wallet — run authDbUpdateAddress or authDbReplayQueue first',
            );
        }
        if (treeState.mac === undefined) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbFastForwardRoot: no root-attestation token for this wallet — run authDbUpdateAddress or authDbReplayQueue first',
            );
        }

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'AuthDbFastForwardRoot',
            'AuthDbFastForwardRootResponse',
            {
                new_root: treeState.root,
                counter: treeState.counter,
                wallet_id: walletId,
                mac: treeState.mac,
            },
        );

        await provider.setTreeState(walletId, {
            root: response.message.new_root ?? treeState.root,
            counter: response.message.counter,
            mac: treeState.mac,
        });

        return {
            counter: response.message.counter,
            walletId: response.message.wallet_id,
        };
    }
}
