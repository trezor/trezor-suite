import {
    TurnOnSuiteSyncForWallet,
    TurnOnSuiteSyncForWalletDeps,
} from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectDeviceByStaticSessionId, selectDevices } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { isSuiteSyncSupportedByDevice } from '../suiteSyncUtils';

export const createTurnOnSuiteSyncForWallet =
    (deps: TurnOnSuiteSyncForWalletDeps): TurnOnSuiteSyncForWallet =>
    async ({ staticSessionId }) => {
        if (!staticSessionId) return;

        const device = selectDeviceByStaticSessionId(deps.getState(), staticSessionId);

        const canTurnOnSuiteSync =
            device && isTrezorDeviceWithState(device) && isSuiteSyncSupportedByDevice(device);

        if (!canTurnOnSuiteSync) {
            return;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(staticSessionId);

        if (device.suiteSyncOwner === undefined) {
            const result = await deps.refreshSuiteSyncKeys({ device });

            if (!result.ok) {
                const errType = result.error.type;

                switch (errType) {
                    case 'RefreshSuiteKeysUnavailable':
                        // This may happen for multiple reasons (disconnected device, ...)
                        // and its ok. We just do nothing.
                        return;

                    case 'DeviceError':
                    case 'DeviceCancelled':
                        deps.dispatch(
                            notificationsActions.addToast({ type: 'suite-sync-keys-error' }),
                        );

                        return;

                    // Those errors are most likely due to Bug in the code or data corruption
                    case 'CreateSuiteSyncOwnerError':
                    case 'ProofOfDelegatedSignFailed':
                        console.error(result.error);
                        // Todo: dispatch better notification
                        deps.dispatch(
                            notificationsActions.addToast({ type: 'suite-sync-keys-error' }),
                        );

                        return;
                    default:
                        return exhaustive(errType);
                }
            }
        }

        // Reselect the device to get the correct secret (cipherKey)
        const reselectedDevice = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === staticSessionId,
        );

        const owner = reselectedDevice?.suiteSyncOwner;

        if (owner === undefined) {
            console.error('Evolu: Keys set to reselectedDevice', reselectedDevice?.suiteSyncOwner);

            return;
        }

        deps.subscribeLabeling({ owner, walletDescriptor });

        return;
    };
