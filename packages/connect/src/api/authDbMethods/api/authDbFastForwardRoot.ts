import { AuthDbSyncError, fastForwardRoot } from '@trezor/authdb';
import type { AuthDbDeviceClient } from '@trezor/authdb';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbFastForwardRootSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

/**
 * Wire shell over @trezor/authdb/sync's fastForwardRoot engine: resolves the provider from
 * settingsStore and builds an AuthDbDeviceClient from the device's typedCall bus.
 */
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
        const cmd = this.getDevice().getCommands();

        const device: AuthDbDeviceClient = {
            deviceId: this.getDevice().features?.device_id ?? '',
            getOfflineOperations: async () =>
                (
                    await cmd.typedCall(
                        'AuthDbGetOfflineOperations',
                        'AuthDbGetOfflineOperationsResponse',
                        {},
                    )
                ).message,
            applyOfflineOperations: async operations =>
                (
                    await cmd.typedCall(
                        'AuthDbApplyOfflineOperations',
                        'AuthDbApplyOfflineOperationsResponse',
                        { operations },
                    )
                ).message,
            deleteOfflineOperations: async () => {
                await cmd.typedCall(
                    'AuthDbDeleteOfflineOperations',
                    'AuthDbDeleteOfflineOperationsResponse',
                    {},
                );
            },
            fastForwardRoot: async request =>
                (
                    await cmd.typedCall(
                        'AuthDbFastForwardRoot',
                        'AuthDbFastForwardRootResponse',
                        request,
                    )
                ).message,
        };

        try {
            return await fastForwardRoot({ provider, device, walletId });
        } catch (err) {
            if (err instanceof AuthDbSyncError) {
                throw ERRORS.TypedError('Runtime', err.message);
            }
            throw err;
        }
    }
}
