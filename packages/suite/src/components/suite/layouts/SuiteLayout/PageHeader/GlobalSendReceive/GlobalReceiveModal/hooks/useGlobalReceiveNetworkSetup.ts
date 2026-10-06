import { useEffect, useMemo, useRef, useState } from 'react';

import { type CryptoId } from 'invity-api';

import { useDevice } from '@suite/device';
import { useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type TradingAssetOption } from '@suite-common/trading';
import { activateNetworkWithDiscoveryThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useDiscovery } from 'src/hooks/suite';

type UseGlobalReceiveNetworkSetupParams = {
    selectedAsset: TradingAssetOption | undefined;
    selectedAssetAccounts: Account[];
    wasSelectedAssetNetworkInactive: boolean;
    onAccountSelectionRequired: () => void;
    onSetupFailure: () => void;
    submitSelection: (account: Account) => void;
};

/**
 * Drives network activation and account discovery for the receive flow's network-setup step.
 *
 * - Only runs while the network-setup step is mounted.
 * - Aborts an ongoing setup request if its basis changes, so it won't advance the flow for a wrong
 *   target.
 * - Falls back to the search step if the asset or device disappears mid-setup.
 * - Dispatches `activateNetworkWithDiscoveryThunk` to enable the network and discover accounts.
 * - Once discovery completes, routes to the next step based on how many accounts were found:
 *   submits the sole account, requests account selection, or reports an error.
 */
export const useGlobalReceiveNetworkSetup = ({
    selectedAsset,
    selectedAssetAccounts,
    wasSelectedAssetNetworkInactive,
    onAccountSelectionRequired,
    onSetupFailure,
    submitSelection,
}: UseGlobalReceiveNetworkSetupParams) => {
    const { device } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();
    const setupRequestRef = useRef<{ abort: () => void; requestId: string } | undefined>(undefined);
    const [completedSetup, setCompletedSetup] = useState<
        | {
              assetCryptoId: CryptoId;
              discoveredAccountCount: number;
          }
        | undefined
    >();

    const selectedAssetId = selectedAsset?.id;
    const selectedAssetNetworkSymbol = selectedAsset?.networkSymbol;
    const devicePath = device?.path;
    const staticSessionId = device?.state?.staticSessionId;
    const setupTarget = useMemo(() => {
        if (!selectedAssetId || !selectedAssetNetworkSymbol || !devicePath || !staticSessionId) {
            return undefined;
        }

        return {
            assetCryptoId: selectedAssetId,
            devicePath,
            networkSymbol: selectedAssetNetworkSymbol,
            staticSessionId,
        };
    }, [devicePath, selectedAssetId, selectedAssetNetworkSymbol, staticSessionId]);

    // Aborting whenever the target changes prevents a result for the previous asset or device
    // from advancing the currently visible flow.
    useEffect(
        () => () => {
            setupRequestRef.current?.abort();
            setupRequestRef.current = undefined;
        },
        [setupTarget],
    );

    useEffect(() => {
        // Do not leave the setup step spinning if its asset or device disappeared.
        if (!setupTarget) {
            onSetupFailure();
        }
    }, [onSetupFailure, setupTarget]);

    useEffect(() => {
        if (
            !setupTarget ||
            isDiscoveryRunning ||
            completedSetup !== undefined ||
            setupRequestRef.current !== undefined
        ) {
            return;
        }

        const setupPromise = dispatch(
            activateNetworkWithDiscoveryThunk({
                devicePath: setupTarget.devicePath,
                staticSessionId: setupTarget.staticSessionId,
                networkSymbol: setupTarget.networkSymbol,
            }),
        );
        setupRequestRef.current = setupPromise;

        void setupPromise.then(action => {
            // An aborted request can settle after a replacement request has started. Only the
            // latest request is allowed to update the step machine.
            if (setupRequestRef.current?.requestId !== setupPromise.requestId) {
                return;
            }

            setupRequestRef.current = undefined;

            if (
                activateNetworkWithDiscoveryThunk.fulfilled.match(action) &&
                action.payload.success
            ) {
                setCompletedSetup({
                    assetCryptoId: setupTarget.assetCryptoId,
                    discoveredAccountCount: action.payload.payload.discoveredAccountCount,
                });
            } else {
                onSetupFailure();
            }
        });
    }, [completedSetup, dispatch, isDiscoveryRunning, onSetupFailure, setupTarget]);

    // Discovery completion and the resulting accounts can reach React in separate renders. Keep
    // the completed setup until selectors expose the accounts that determine the next step.
    useEffect(() => {
        if (completedSetup === undefined) {
            return;
        }

        if (completedSetup.assetCryptoId !== selectedAsset?.id) {
            setCompletedSetup(undefined);

            return;
        }

        const [onlyAccount] = selectedAssetAccounts;

        if (selectedAssetAccounts.length === 1 && onlyAccount) {
            if (wasSelectedAssetNetworkInactive) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'accounts-discovered',
                        count: completedSetup.discoveredAccountCount,
                        networkName: selectedAsset.networkName,
                    }),
                );
            }

            setCompletedSetup(undefined);
            submitSelection(onlyAccount);

            return;
        }

        if (selectedAssetAccounts.length > 1) {
            setCompletedSetup(undefined);
            onAccountSelectionRequired();

            return;
        }

        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: translationString('TR_GLOBAL_RECEIVE_NO_ACCOUNT_FOUND'),
            }),
        );
        setCompletedSetup(undefined);
        onSetupFailure();
    }, [
        dispatch,
        onAccountSelectionRequired,
        onSetupFailure,
        selectedAsset,
        selectedAssetAccounts,
        completedSetup,
        submitSelection,
        translationString,
        wasSelectedAssetNetworkInactive,
    ]);
};
