import type { MethodPermission } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

/**
 * Drains the device's offline queue (AuthDbGetOfflineOperations) and, unlike the raw wire
 * call, immediately persists the drained entries into the injected authLabelLookupProvider's
 * OfflineQueueProvider extension — the same auto-persist pattern authDbUpdateAddress uses for
 * tree state. Returns the raw device response so callers can inspect current_root/counter too.
 */
export default class AuthDbGetOfflineOperations extends AbstractMethod<
    'authDbGetOfflineOperations',
    Record<string, never>
> {
    constructor(message: MethodMessage<'authDbGetOfflineOperations'>) {
        const { payload } = message;
        Assert(PROTO.AuthDbGetOfflineOperations, payload);

        super(message, {});
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get info() {
        return 'Drain AuthDB offline queue';
    }

    async run(): Promise<PROTO.AuthDbGetOfflineOperationsResponse> {
        const provider = settingsStore.get('authLabelLookupProvider');
        if (!provider?.appendQueueEntries) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbGetOfflineOperations requires a provider implementing OfflineQueueProvider',
            );
        }

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'AuthDbGetOfflineOperations',
            'AuthDbGetOfflineOperationsResponse',
            {},
        );

        if (response.message.operations.length > 0) {
            const deviceId = this.getDevice().features?.device_id ?? '';
            const walletId = response.message.wallet_id ?? '';
            await provider.appendQueueEntries(
                response.message.operations.map(op => ({
                    deviceId,
                    walletId,
                    mac: op.mac,
                    sequence: op.sequence,
                    address: op.address,
                    oldValue: op.old_value ?? '',
                    newValue: op.new_value ?? '',
                    oldCounter: op.old_counter,
                    newCounter: op.new_counter,
                })),
            );
        }

        return response.message;
    }
}
