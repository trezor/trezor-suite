import { useEffect, useMemo, useRef, useState } from 'react';

import { type CryptoId } from 'invity-api';

import { useTranslation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type TradingAssetOption } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { type DeviceUniquePath, type StaticSessionId } from '@trezor/connect';

import { activateNetworkWithDiscoveryThunk } from 'src/actions/wallet/activateNetworkWithDiscoveryThunk';

import { type GlobalReceiveStep } from '../types';

type UseGlobalReceiveNetworkSetupParams = {
    devicePath: DeviceUniquePath | undefined;
    isDiscoveryRunning: boolean;
    receiveStep: GlobalReceiveStep;
    selectedAsset: TradingAssetOption | undefined;
    selectedAssetAccounts: Account[];
    staticSessionId: StaticSessionId | undefined;
    onAccountSelectionRequired: () => void;
    onSetupFailure: () => void;
    submitSelection: (account: Account) => void;
};

export const useGlobalReceiveNetworkSetup = ({
    devicePath,
    isDiscoveryRunning,
    receiveStep,
    selectedAsset,
    selectedAssetAccounts,
    staticSessionId,
    onAccountSelectionRequired,
    onSetupFailure,
    submitSelection,
}: UseGlobalReceiveNetworkSetupParams) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const setupRequestRef = useRef<{ abort: () => void; requestId: string } | undefined>(undefined);
    const [setupCompletedAssetCryptoId, setSetupCompletedAssetCryptoId] = useState<
        CryptoId | undefined
    >();

    const selectedAssetId = selectedAsset?.id;
    const selectedAssetNetworkSymbol = selectedAsset?.networkSymbol;
    const setupTarget = useMemo(() => {
        if (
            receiveStep !== 'network-setup' ||
            !selectedAssetId ||
            !selectedAssetNetworkSymbol ||
            !devicePath ||
            !staticSessionId
        ) {
            return undefined;
        }

        return {
            assetCryptoId: selectedAssetId,
            devicePath,
            networkSymbol: selectedAssetNetworkSymbol,
            staticSessionId,
        };
    }, [devicePath, receiveStep, selectedAssetId, selectedAssetNetworkSymbol, staticSessionId]);

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
        if (receiveStep === 'network-setup' && !setupTarget) {
            onSetupFailure();
        }
    }, [onSetupFailure, receiveStep, setupTarget]);

    useEffect(() => {
        if (
            !setupTarget ||
            isDiscoveryRunning ||
            setupCompletedAssetCryptoId !== undefined ||
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
                setSetupCompletedAssetCryptoId(setupTarget.assetCryptoId);
            } else {
                onSetupFailure();
            }
        });
    }, [dispatch, isDiscoveryRunning, onSetupFailure, setupCompletedAssetCryptoId, setupTarget]);

    // Discovery completion and the resulting accounts can reach React in separate renders. Keep
    // the completed asset id until selectors expose the accounts that determine the next step.
    useEffect(() => {
        if (setupCompletedAssetCryptoId === undefined) {
            return;
        }

        if (receiveStep !== 'network-setup' || setupCompletedAssetCryptoId !== selectedAsset?.id) {
            setSetupCompletedAssetCryptoId(undefined);

            return;
        }

        const [onlyAccount] = selectedAssetAccounts;

        if (selectedAssetAccounts.length === 1 && onlyAccount) {
            setSetupCompletedAssetCryptoId(undefined);
            submitSelection(onlyAccount);

            return;
        }

        if (selectedAssetAccounts.length > 1) {
            setSetupCompletedAssetCryptoId(undefined);
            onAccountSelectionRequired();

            return;
        }

        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: translationString('TR_GLOBAL_RECEIVE_NO_ACCOUNT_FOUND'),
            }),
        );
        setSetupCompletedAssetCryptoId(undefined);
        onSetupFailure();
    }, [
        dispatch,
        onAccountSelectionRequired,
        onSetupFailure,
        receiveStep,
        selectedAsset,
        selectedAssetAccounts,
        setupCompletedAssetCryptoId,
        submitSelection,
        translationString,
    ]);
};
