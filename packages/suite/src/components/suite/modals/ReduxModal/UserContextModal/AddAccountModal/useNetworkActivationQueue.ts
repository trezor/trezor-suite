import { useEffect, useMemo, useRef, useState } from 'react';

import { preserveModal, removePreserveModal } from '@suite/modal';
import { useDispatch } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { activateNetworkWithDiscoveryThunk } from 'src/actions/wallet/activateNetworkWithDiscoveryThunk';

import { enqueueNetworkActivation } from './addAccountModalUtils';

type ActivationRequest = {
    requestId: string;
};

/**
 * @deprecated Temporary PoC code, will be moved. Do not create new imports.
 * TODO https://github.com/trezor/trezor-suite/issues/31779
 */
export const useNetworkActivationQueue = (device: TrezorDevice) => {
    const dispatch = useDispatch();
    const [queuedNetworkSymbols, setQueuedNetworkSymbols] = useState<NetworkSymbol[]>([]);
    const [activeNetworkSymbol, setActiveNetworkSymbol] = useState<NetworkSymbol>();
    const [activationErrors, setActivationErrors] = useState<
        Partial<Record<NetworkSymbol, string>>
    >({});
    const activationRequestRef = useRef<ActivationRequest | undefined>(undefined);
    const hasPreservedModalRef = useRef(false);

    useEffect(
        () => () => {
            // Choosing a network commits its activation. Closing Add account only detaches this
            // hook from the result; discovery must keep running in the background.
            activationRequestRef.current = undefined;

            if (hasPreservedModalRef.current) {
                dispatch(removePreserveModal());
            }
        },
        [dispatch],
    );

    useEffect(() => {
        const staticSessionId = device.state?.staticSessionId;
        const nextNetworkSymbol = queuedNetworkSymbols[0];

        if (activeNetworkSymbol || !nextNetworkSymbol || !staticSessionId) {
            return;
        }

        setQueuedNetworkSymbols(currentQueue => currentQueue.slice(1));
        setActiveNetworkSymbol(nextNetworkSymbol);

        if (!hasPreservedModalRef.current) {
            hasPreservedModalRef.current = true;
            dispatch(preserveModal());
        }

        const activationPromise = dispatch(
            activateNetworkWithDiscoveryThunk({
                devicePath: device.path,
                staticSessionId,
                networkSymbol: nextNetworkSymbol,
            }),
        );
        activationRequestRef.current = activationPromise;

        void activationPromise.then(action => {
            if (activationRequestRef.current?.requestId !== activationPromise.requestId) {
                return;
            }

            activationRequestRef.current = undefined;

            if (activateNetworkWithDiscoveryThunk.fulfilled.match(action)) {
                if (action.payload.success) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'accounts-discovered',
                            count: action.payload.discoveredAccountCount,
                            networkName: getNetwork(nextNetworkSymbol).name,
                        }),
                    );
                } else if (!action.payload.wasCancelled) {
                    const { error } = action.payload;
                    setActivationErrors(currentErrors => ({
                        ...currentErrors,
                        [nextNetworkSymbol]: error,
                    }));
                }
            } else if (!action.meta.aborted) {
                const error = action.error.message ?? 'Network activation failed';
                setActivationErrors(currentErrors => ({
                    ...currentErrors,
                    [nextNetworkSymbol]: error,
                }));
                dispatch(notificationsActions.addToast({ type: 'discovery-error', error }));
            }

            setActiveNetworkSymbol(undefined);
        });
    }, [
        activeNetworkSymbol,
        device.path,
        device.state?.staticSessionId,
        dispatch,
        queuedNetworkSymbols,
    ]);

    const activatingNetworkSymbols = useMemo(
        () => [...(activeNetworkSymbol ? [activeNetworkSymbol] : []), ...queuedNetworkSymbols],
        [activeNetworkSymbol, queuedNetworkSymbols],
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
