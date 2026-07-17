import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { type TransactionsRootState, confirmAddressOnDeviceThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { useAlert } from '@suite-native/alerts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import type {
    ReceiveStackParamList,
    ReceiveStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { AddressVerificationResultType, verifyReceiveAddress } from '../addressVerification';

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAddress
>;

export const useReceiveAddressVerification = (accountKey: AccountKey) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const { showToast } = useToast();

    const { showAlert } = useAlert();

    const freshAddress = useSelector((state: NativeAccountsRootState & TransactionsRootState) =>
        selectFreshAccountAddress(state, accountKey),
    );

    const handleCancel = useCallback(() => {
        TrezorConnect.cancel();
    }, []);

    const verifyAddressOnDevice = useCallback(async (): Promise<void> => {
        try {
            if (!freshAddress) {
                return;
            }

            const result = await verifyReceiveAddress(() =>
                dispatch(
                    confirmAddressOnDeviceThunk({
                        accountKey,
                        addressPath: freshAddress.path,
                        chunkify: true,
                    }),
                ).unwrap(),
            );

            switch (result.type) {
                case AddressVerificationResultType.Success:
                    analytics.report({ type: events.receiveAddressConfirmOnTrezorEvent.name });
                    break;
                case AddressVerificationResultType.DeviceAccessError:
                    console.warn(result.error);
                    break;
                case AddressVerificationResultType.ActionCancelled:
                    showToast({
                        icon: 'warningCircle',
                        intent: 'neutral',
                        message: <Translation id="moduleReceive.deviceCancelError" />,
                    });
                    break;
                case AddressVerificationResultType.PassphraseIncorrect:
                    showAlert({
                        title: <Translation id="modulePassphrase.featureAuthorizationError" />,
                        pictogramVariant: 'critical',
                        primaryButtonTitle: <Translation id="generic.buttons.close" />,
                        onPressPrimaryButton: handleCancel,
                        primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                    });
                    break;
                case AddressVerificationResultType.Unexpected:
                    showAlert({
                        title: result.error.code,
                        description: result.error.message,
                        pictogramVariant: 'critical',
                        primaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                        onPressPrimaryButton: handleCancel,
                    });
                    break;
                case AddressVerificationResultType.Silent:
                    break;
                default:
                    return exhaustive(result);
            }
        } finally {
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    }, [
        accountKey,
        analytics,
        dispatch,
        freshAddress,
        handleCancel,
        navigation,
        showAlert,
        showToast,
    ]);

    return {
        verifyAddressOnDevice,
    };
};
