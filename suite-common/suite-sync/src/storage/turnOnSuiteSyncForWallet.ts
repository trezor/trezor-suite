import { Dispatch } from '@reduxjs/toolkit';

import { TrezorDeviceWithState } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectDevices } from '@suite-common/wallet-core/src/device/deviceSelectors';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { SubscribeLabeling } from '../labeling/createSubscribeLabeling';
import { RefreshSuiteSyncKeys } from '../refreshSuiteSyncKeys';
import { isSuiteSyncSupportedByDevice } from '../suiteSyncUtils';

type TurnOnSuiteSyncForWalletDeps = {
    dispatch: Dispatch;
    getState: () => any;
    subscribeLabeling: SubscribeLabeling;
    refreshSuiteSyncKeys: RefreshSuiteSyncKeys;
};

export type TurnOnSuiteSyncForWallet = (params: { device: TrezorDeviceWithState }) => Promise<void>;

export type TurnOffSuiteSyncForWallet = (params: {
    device: TrezorDeviceWithState;
}) => Promise<void>;

export type TurnOnSuiteSyncForWalletDep = {
    turnOnSuiteSyncForWallet: TurnOnSuiteSyncForWallet;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const createTurnOnSuiteSyncForWallet =
    (deps: TurnOnSuiteSyncForWalletDeps): TurnOnSuiteSyncForWallet =>
    async ({ device }) => {
        if (!isSuiteSyncSupportedByDevice(device)) {
            return;
        }

        const deviceStaticSessionId = device.state.staticSessionId;

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

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
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = reselectedDevice?.suiteSyncOwner;

        if (owner === undefined) {
            console.error('Evolu: Keys set to reselectedDevice', reselectedDevice?.suiteSyncOwner);

            return;
        }

        deps.subscribeLabeling({ owner, walletDescriptor });

        return;
    };
