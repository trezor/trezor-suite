import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import TrezorConnect from '@trezor/connect';
import {
    AccountsRootState,
    selectAccountByKey,
    TransactionsRootState,
    selectPendingAccountAddresses,
    selectIsAccountUtxoBased,
    selectAccountNetworkSymbol,
    selectIsPortfolioTrackerDevice,
    confirmAddressOnDeviceThunk,
    selectIsDeviceInViewOnlyMode,
    deviceActions,
    selectDevice,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { useToast } from '@suite-native/toasts';
import { Translation } from '@suite-native/intl';

export const useAccountReceiveAddress = (accountKey: AccountKey) => {
    const dispatch = useDispatch();
    const [isReceiveApproved, setIsReceiveApproved] = useState(false);
    const [isUnverifiedAddressRevealed, setIsUnverifiedAddressRevealed] = useState(false);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const navigation = useNavigation();

    const { showToast } = useToast();

    const { showAlert } = useAlert();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const pendingAddresses = useSelector((state: TransactionsRootState) =>
        selectPendingAccountAddresses(state, accountKey),
    );
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );

    const device = useSelector(selectDevice);

    const freshAddress = useMemo(() => {
        if (account) {
            return getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased);
        }
    }, [account, pendingAddresses, isAccountUtxoBased]);

    const handleCancel = () => {
        TrezorConnect.cancel();
        setIsUnverifiedAddressRevealed(false);
        dispatch(
            deviceActions.removeButtonRequests({
                device,
                buttonRequestCode: 'ButtonRequest_Other',
            }),
        );
    };

    const verifyAddressOnDevice = async (): Promise<boolean> => {
        if (accountKey && freshAddress) {
            const response = await requestPrioritizedDeviceAccess(() => {
                const thunkResponse = dispatch(
                    confirmAddressOnDeviceThunk({
                        accountKey,
                        addressPath: freshAddress.path,
                        chunkify: true,
                    }),
                ).unwrap();

                return thunkResponse;
            });

            if (!response.success) {
                // Wasn't able to get access to device
                console.warn(response.error);

                return false;
            }

            if (
                !response.payload.success &&
                response.payload.payload.code === 'Failure_ActionCancelled'
            ) {
                showToast({
                    icon: 'warningCircle',
                    variant: 'default',
                    message: <Translation id="moduleReceive.deviceCancelError" />,
                });
                if (navigation.canGoBack()) {
                    navigation.goBack();
                }

                return false;
            }

            if (
                !response.payload.success &&
                // Do not show alert for user cancelled actions
                ![
                    'Method_Interrupted',
                    'Failure_PinInvalid',
                    'Method_Cancel',
                    'Failure_PinCancelled',
                ].includes(response.payload.payload.code ?? '')
            ) {
                showAlert({
                    title: response.payload.payload.code,
                    description: response.payload.payload.error,
                    primaryButtonVariant: 'redBold',
                    primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
                    onPressPrimaryButton: () => {
                        handleCancel();
                        // Handle show address calls verifyAddressOnDevice and here we want to trigger it again so there is cyclic dependency
                        // between these calls.
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        handleShowAddress();
                    },
                    secondaryButtonVariant: 'redElevation0',
                    secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    onPressSecondaryButton: () => {
                        handleCancel();
                        if (navigation.canGoBack()) navigation.goBack();
                    },
                });

                return false;
            }

            return response.payload.success;
        }

        return false;
    };

    const handleShowAddress = async () => {
        if (isPortfolioTrackerDevice) {
            if (networkSymbol) {
                analytics.report({
                    type: EventType.CreateReceiveAddressShowAddress,
                    payload: { assetSymbol: networkSymbol },
                });
                setIsReceiveApproved(true);
            }
        } else if (isDeviceInViewOnlyMode) {
            // If device is remembered,
            // no verification should happen and we display the receive address straight away.
            setIsUnverifiedAddressRevealed(true);
            setIsReceiveApproved(true);
        } else {
            setIsUnverifiedAddressRevealed(true);
            const wasVerificationSuccessful = await verifyAddressOnDevice();

            if (wasVerificationSuccessful) {
                analytics.report({ type: EventType.ConfirmedReceiveAdress });
                setIsReceiveApproved(true);
            } else {
                setIsUnverifiedAddressRevealed(false);
            }
        }
        dispatch(
            deviceActions.removeButtonRequests({
                device,
                buttonRequestCode: 'ButtonRequest_Address',
            }),
        );
    };

    return {
        address: freshAddress?.address,
        isReceiveApproved,
        isUnverifiedAddressRevealed,
        handleShowAddress,
    };
};
