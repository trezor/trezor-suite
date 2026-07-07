import { AuthDbSyncError, replayQueue } from '@trezor/authdb';
import type { AuthDbDeviceClient } from '@trezor/authdb';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbReplayQueueSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

/**
 * Wire shell over @trezor/authdb/sync's replayQueue engine: resolves the provider from
 * settingsStore, builds an AuthDbDeviceClient from the device's typedCall bus, and lets
 * the engine own the drain -> rebase -> replay -> persist orchestration.
 */
export default class AuthDbReplayQueue extends AbstractMethod<
    'authDbReplayQueue',
    AuthDbReplayQueueSchema
> {
    constructor(message: MethodMessage<'authDbReplayQueue'>) {
        const { payload } = message;
        Assert(AuthDbReplayQueueSchema, payload);

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
            label: 'Replay this wallet’s queued entries onto the device?',
        };
    }

    get info() {
        return 'Replay AuthDB offline queue (full sync)';
    }

    async run() {
        const provider = settingsStore.get('authLabelLookupProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbReplayQueue requires authLabelLookupProvider to be set via TrezorConnect.init()',
            );
        }
        if (
            !provider.appendQueueEntries ||
            !provider.getQueueEntries ||
            !provider.clearQueueEntries
        ) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbReplayQueue requires a provider implementing OfflineQueueProvider',
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
            return await replayQueue({ provider: provider as never, device, walletId });
        } catch (err) {
            if (err instanceof AuthDbSyncError) {
                throw ERRORS.TypedError('Runtime', err.message);
            }
            throw err;
        }
    }
}
