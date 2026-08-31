import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath, type StaticSessionId } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import { selectDiscoveryByDevicePath } from './discoverySelectors';
import {
    type RunAdditionalDiscoveryThunkDeps,
    type RunAdditionalDiscoveryThunkState,
    cancelDiscoveryThunk,
    runAdditionalDiscoveryThunk,
} from './discoveryThunks';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccounts } from '../accounts/accountsSelectors';
import { selectEnabledNetworks } from '../settings/walletSettingsReducer';
import {
    type ChangeCoinVisibilityThunkState,
    changeCoinVisibilityThunk,
} from '../settings/walletSettingsThunks';

const subscribeToAbort = (signal: AbortSignal, abort: () => void): (() => void) => {
    // The signal may have aborted before the listener was registered.
    if (signal.aborted) {
        abort();

        return () => {};
    }

    signal.addEventListener('abort', abort, { once: true });

    return () => signal.removeEventListener('abort', abort);
};

type ActivateNetworkWithDiscoveryThunkParams = {
    devicePath: DeviceUniquePath;
    staticSessionId: StaticSessionId;
    networkSymbol: NetworkSymbol;
};

export type ActivateNetworkWithDiscoveryThunkState = ChangeCoinVisibilityThunkState &
    RunAdditionalDiscoveryThunkState;

export type ActivateNetworkWithDiscoveryThunkDeps = RunAdditionalDiscoveryThunkDeps;

type ActivateNetworkWithDiscoveryError = {
    message: string;
    wasCancelled: boolean;
};

export type ActivateNetworkWithDiscoveryResult = Result<
    { discoveredAccountCount: number },
    ActivateNetworkWithDiscoveryError
>;

export const activateNetworkWithDiscoveryThunk = createThunk<
    ActivateNetworkWithDiscoveryResult,
    ActivateNetworkWithDiscoveryThunkParams,
    {
        state: ActivateNetworkWithDiscoveryThunkState;
        extra: ActivateNetworkWithDiscoveryThunkDeps;
    }
>(
    `${DISCOVERY_MODULE_PREFIX}/activateNetwork`,
    async ({ devicePath, staticSessionId, networkSymbol }, { dispatch, getState, signal }) => {
        const wasNetworkEnabled = selectEnabledNetworks(getState()).includes(networkSymbol);
        const existingAccountKeys = new Set<AccountKey>(
            selectAccounts(getState())
                .filter(
                    account =>
                        account.deviceState === staticSessionId && account.symbol === networkSymbol,
                )
                .map(account => account.key),
        );

        // Mark discovery as running before changing visibility. The discovery middleware checks
        // this state and would otherwise start a second discovery for the same network.
        dispatch(
            discoveryActions.startDiscovery(devicePath, {
                isAddingHiddenWallet: false,
                isAddingExistingWallet: false,
            }),
        );

        if (!wasNetworkEnabled) {
            const enableResult = await dispatch(
                changeCoinVisibilityThunk({ symbol: networkSymbol, shouldBeVisible: true }),
            );

            // Coin visibility updates do not support cooperative cancellation. Wait for the update
            // to settle before rolling it back, otherwise the still-running body could re-enable
            // the network after the rollback.
            const wasActivationRejected = changeCoinVisibilityThunk.rejected.match(enableResult);

            if (wasActivationRejected || signal.aborted) {
                await dispatch(
                    changeCoinVisibilityThunk({ symbol: networkSymbol, shouldBeVisible: false }),
                );

                const wasCancelled = signal.aborted;
                let error = 'Network activation cancelled';

                if (!wasCancelled && wasActivationRejected) {
                    error = enableResult.error.message ?? 'Network activation failed';
                }

                const status: DiscoveryStatus = wasCancelled
                    ? { status: 'cancelled' }
                    : { status: 'failed', error };

                dispatch(discoveryActions.updateDiscovery(status, devicePath));

                if (!wasCancelled) {
                    dispatch(notificationsActions.addToast({ type: 'discovery-error', error }));
                }

                return err({ message: error, wasCancelled });
            }
        }

        const discoveryPromise = dispatch(runAdditionalDiscoveryThunk(staticSessionId));
        const abortDiscovery = () => {
            discoveryPromise.abort();

            const device = selectDeviceByStaticSessionId(getState(), staticSessionId);

            if (device) {
                dispatch(cancelDiscoveryThunk(device));
            }
        };

        const unsubscribeAbortDiscovery = subscribeToAbort(signal, abortDiscovery);
        const discoveryResult = await discoveryPromise;
        unsubscribeAbortDiscovery();
        const discovery = selectDiscoveryByDevicePath(getState(), devicePath);
        // A fulfilled thunk only says its async work returned. The discovery state is the source of
        // truth for whether account discovery itself reached completion.
        const wasDiscoverySuccessful =
            runAdditionalDiscoveryThunk.fulfilled.match(discoveryResult) &&
            discovery?.status === 'complete';

        if (wasDiscoverySuccessful) {
            const discoveredAccountCount = selectAccounts(getState()).filter(
                account =>
                    account.deviceState === staticSessionId &&
                    account.symbol === networkSymbol &&
                    account.visible,
            ).length;

            return ok({ discoveredAccountCount });
        }

        const newlyCreatedAccounts = selectAccounts(getState()).filter(
            account =>
                account.deviceState === staticSessionId &&
                account.symbol === networkSymbol &&
                !existingAccountKeys.has(account.key),
        );

        if (newlyCreatedAccounts.length > 0) {
            dispatch(accountsActions.removeAccount(newlyCreatedAccounts));
        }

        const wasCancelled = signal.aborted || discovery?.status === 'cancelled';
        let error = 'Account discovery failed';

        if (discovery?.status === 'failed') {
            error = discovery.error ?? error;
        } else if (runAdditionalDiscoveryThunk.rejected.match(discoveryResult)) {
            error = discoveryResult.error.message ?? error;
        }

        const finalDiscoveryStatus: DiscoveryStatus = wasCancelled
            ? { status: 'cancelled' }
            : { status: 'failed', error };

        if (!wasNetworkEnabled) {
            // Keep discovery marked as running during rollback for the same middleware reason as
            // activation: hiding the network must not start another discovery concurrently.
            dispatch(
                discoveryActions.startDiscovery(devicePath, {
                    isAddingHiddenWallet: false,
                    isAddingExistingWallet: false,
                }),
            );
            await dispatch(
                changeCoinVisibilityThunk({ symbol: networkSymbol, shouldBeVisible: false }),
            );
        }

        dispatch(discoveryActions.updateDiscovery(finalDiscoveryStatus, devicePath));

        if (!wasCancelled) {
            dispatch(notificationsActions.addToast({ type: 'discovery-error', error }));
        }

        return err({ message: error, wasCancelled });
    },
);
