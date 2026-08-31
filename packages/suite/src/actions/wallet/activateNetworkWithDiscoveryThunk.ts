import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type ChangeCoinVisibilityThunkState,
    type RunAdditionalDiscoveryThunkDeps,
    type RunAdditionalDiscoveryThunkState,
    accountsActions,
    cancelDiscoveryThunk,
    changeCoinVisibilityThunk,
    discoveryActions,
    runAdditionalDiscoveryThunk,
    selectAccounts,
    selectDiscoveryByDevicePath,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { type AccountKey, type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath, type StaticSessionId } from '@trezor/connect';

const NETWORK_ACTIVATION_THUNK_PREFIX = '@suite/network-activation';

const subscribeToAbort = (signal: AbortSignal, abort: () => void): (() => void) => {
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

export type ActivateNetworkWithDiscoveryResult =
    | { success: true; discoveredAccountCount: number }
    | { success: false; error: string; wasCancelled: boolean };

export const activateNetworkWithDiscoveryThunk = createThunk<
    ActivateNetworkWithDiscoveryResult,
    ActivateNetworkWithDiscoveryThunkParams,
    {
        state: ActivateNetworkWithDiscoveryThunkState;
        extra: ActivateNetworkWithDiscoveryThunkDeps;
    }
>(
    `${NETWORK_ACTIVATION_THUNK_PREFIX}/activate`,
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
            const enablePromise = dispatch(
                changeCoinVisibilityThunk({ symbol: networkSymbol, shouldBeVisible: true }),
            );
            const abortEnable = () => enablePromise.abort();
            const unsubscribeAbortEnable = subscribeToAbort(signal, abortEnable);
            const enableResult = await enablePromise;
            unsubscribeAbortEnable();

            if (changeCoinVisibilityThunk.rejected.match(enableResult)) {
                await dispatch(
                    changeCoinVisibilityThunk({ symbol: networkSymbol, shouldBeVisible: false }),
                );

                const wasCancelled = signal.aborted;
                const error = wasCancelled
                    ? 'Network activation cancelled'
                    : (enableResult.error.message ?? 'Network activation failed');
                const status: DiscoveryStatus = wasCancelled
                    ? { status: 'cancelled' }
                    : { status: 'failed', error };

                dispatch(discoveryActions.updateDiscovery(status, devicePath));

                if (!wasCancelled) {
                    dispatch(notificationsActions.addToast({ type: 'discovery-error', error }));
                }

                return { success: false, error, wasCancelled };
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

            return { success: true, discoveredAccountCount };
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

        return { success: false, error, wasCancelled };
    },
);
