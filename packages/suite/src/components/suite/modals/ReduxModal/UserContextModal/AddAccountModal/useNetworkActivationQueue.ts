import { useEffect, useMemo, useRef, useState } from 'react';

import { preserveModal } from '@suite/modal';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    accountsActions,
    changeCoinVisibility,
    discoveryActions,
    runAdditionalDiscoveryThunk,
    selectAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey, type DiscoveryStatus } from '@suite-common/wallet-types';

import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';

import { enqueueNetworkActivation, getNewNetworkAccounts } from './addAccountModalUtils';

type ActiveNetworkActivation = {
    networkSymbol: NetworkSymbol;
    existingAccountKeys: Set<AccountKey>;
};

/**
 * @deprecated Temporary PoC code, will be moved, do not create new imports!
 * TODO https://github.com/trezor/trezor-suite/issues/31779
 */
export const useNetworkActivationQueue = (device: TrezorDevice) => {
    const accounts = useSelector(selectAccounts);
    const { discovery } = useDiscovery();
    const dispatch = useDispatch();

    const [queuedNetworkSymbols, setQueuedNetworkSymbols] = useState<NetworkSymbol[]>([]);
    const [activeActivation, setActiveActivation] = useState<ActiveNetworkActivation>();
    const [activationErrors, setActivationErrors] = useState<
        Partial<Record<NetworkSymbol, string>>
    >({});
    const isRollingBackRef = useRef(false);

    useEffect(() => {
        const staticSessionId = device.state?.staticSessionId;
        const nextNetworkSymbol = queuedNetworkSymbols[0];

        if (activeActivation || !nextNetworkSymbol || !staticSessionId) {
            return;
        }

        const existingAccountKeys = new Set(
            accounts
                .filter(
                    account =>
                        account.deviceState === staticSessionId &&
                        account.symbol === nextNetworkSymbol,
                )
                .map(account => account.key),
        );

        setQueuedNetworkSymbols(currentQueue => currentQueue.slice(1));
        setActiveActivation({ networkSymbol: nextNetworkSymbol, existingAccountKeys });

        // Setting discovery to a running state before enabling the network prevents
        // discoveryMiddleware from starting a duplicate discovery call.
        dispatch(preserveModal());
        dispatch(
            discoveryActions.startDiscovery(device.path, {
                isAddingHiddenWallet: false,
                isAddingExistingWallet: false,
            }),
        );

        void dispatch(
            changeCoinVisibility({
                symbol: nextNetworkSymbol,
                shouldBeVisible: true,
            }),
        )
            .then(result => {
                if (changeCoinVisibility.rejected.match(result)) {
                    dispatch(
                        discoveryActions.updateDiscovery(
                            {
                                status: 'failed',
                                error: result.error.message ?? 'Network activation failed',
                            },
                            device.path,
                        ),
                    );

                    return;
                }

                return dispatch(runAdditionalDiscoveryThunk(staticSessionId));
            })
            .then(result => {
                if (result && runAdditionalDiscoveryThunk.rejected.match(result)) {
                    dispatch(
                        discoveryActions.updateDiscovery(
                            {
                                status: 'failed',
                                error: result.error.message ?? 'Account discovery failed',
                            },
                            device.path,
                        ),
                    );
                }
            });
    }, [
        accounts,
        activeActivation,
        device.path,
        device.state?.staticSessionId,
        dispatch,
        queuedNetworkSymbols,
    ]);

    useEffect(() => {
        if (!activeActivation || !discovery || isRollingBackRef.current) {
            return;
        }

        const { networkSymbol, existingAccountKeys } = activeActivation;
        const staticSessionId = device.state?.staticSessionId;

        if (discovery.status === 'complete') {
            const discoveredAccountCount = accounts.filter(
                account =>
                    account.deviceState === staticSessionId &&
                    account.symbol === networkSymbol &&
                    account.visible,
            ).length;

            dispatch(
                notificationsActions.addToast({
                    type: 'accounts-discovered',
                    count: discoveredAccountCount,
                    networkName: getNetwork(networkSymbol).name,
                }),
            );
            setActiveActivation(undefined);

            return;
        }

        const shouldRollbackNetworkActivation = (status: DiscoveryStatus['status']) =>
            status === 'failed' || status === 'cancelled';
        if (!shouldRollbackNetworkActivation(discovery.status)) {
            return;
        }

        const newNetworkAccounts = getNewNetworkAccounts({
            accounts,
            existingAccountKeys,
            networkSymbol,
        });
        const failedStatus = discovery;
        isRollingBackRef.current = true;

        if (newNetworkAccounts.length > 0) {
            dispatch(accountsActions.removeAccount(newNetworkAccounts));
        }

        dispatch(
            discoveryActions.startDiscovery(device.path, {
                isAddingHiddenWallet: false,
                isAddingExistingWallet: false,
            }),
        );

        void dispatch(
            changeCoinVisibility({
                symbol: networkSymbol,
                shouldBeVisible: false,
            }),
        ).then(() => {
            dispatch(discoveryActions.updateDiscovery(failedStatus, device.path));

            if (failedStatus.status === 'failed') {
                const error = failedStatus.error ?? 'Unknown error';
                setActivationErrors(currentErrors => ({
                    ...currentErrors,
                    [networkSymbol]: error,
                }));
                dispatch(notificationsActions.addToast({ type: 'discovery-error', error }));
            }

            isRollingBackRef.current = false;
            setActiveActivation(undefined);
        });
    }, [
        accounts,
        activeActivation,
        device.path,
        device.state?.staticSessionId,
        discovery,
        dispatch,
    ]);

    const activatingNetworkSymbols = useMemo(
        () => [
            ...(activeActivation ? [activeActivation.networkSymbol] : []),
            ...queuedNetworkSymbols,
        ],
        [activeActivation, queuedNetworkSymbols],
    );

    const activateNetwork = (networkSymbol: NetworkSymbol) => {
        if (activatingNetworkSymbols.includes(networkSymbol)) {
            return;
        }

        setActivationErrors(currentErrors => {
            const { [networkSymbol]: _, ...remainingErrors } = currentErrors;

            return remainingErrors;
        });
        setQueuedNetworkSymbols(currentQueue =>
            enqueueNetworkActivation(currentQueue, networkSymbol),
        );
    };

    return {
        activateNetwork,
        activatingNetworkSymbols,
        activationErrors,
    };
};
