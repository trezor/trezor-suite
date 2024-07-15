import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    deviceActions,
    selectDevice,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceDiscoveryActive,
} from '@suite-common/wallet-core';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectHasAuthFailed,
    selectHasVerificationCancelledError,
    retryPassphraseAuthenticationThunk,
    selectHasPassphraseMismatchError,
} from '@suite-native/device-authorization';
import { useAlert } from '@suite-native/alerts';

import { DeviceT3T1Svg } from '../../assets/passphrase/DeviceT3T1Svg';
import { PassphraseScreenWrapper } from '../../components/passphrase/PassphraseScreenWrapper';
import { useRedirectOnPassphraseCompletion } from '../../useRedirectOnPassphraseCompletion';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor,
    RootStackParamList
>;

export const PassphraseConfirmOnTrezorScreen = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const device = useSelector(selectDevice);
    const hasAuthorizationFailed = useSelector(selectHasAuthFailed);
    const hasVerificationCancelledError = useSelector(selectHasVerificationCancelledError);
    const hasPassphraseMismatchError = useSelector(selectHasPassphraseMismatchError);

    const { showAlert } = useAlert();

    // If this screen was present during authorizing device with passphrase for some feature,
    // on success, this hook will close the stack and go back
    useRedirectOnPassphraseCompletion();

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized && isDiscoveryActive) {
            navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseLoading);
            dispatch(
                deviceActions.removeButtonRequests({
                    device,
                    buttonRequestCode: 'ButtonRequest_Other',
                }),
            );
        }
    }, [device, dispatch, isDeviceConnectedAndAuthorized, isDiscoveryActive, navigation]);

    useEffect(() => {
        // User has canceled the authorization process on device (authorizeDeviceThunk rejects with auth-failed error)
        if (hasAuthorizationFailed || hasVerificationCancelledError) {
            dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
        }
    }, [dispatch, hasAuthorizationFailed, hasVerificationCancelledError]);

    useEffect(() => {
        // Wrong passphrase was entered during verifying empty wallet
        if (hasPassphraseMismatchError) {
            showAlert({
                title: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.title" />
                ),
                description: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.primaryButton" />
                ),
                onPressPrimaryButton: () => {
                    navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseForm);
                    dispatch(retryPassphraseAuthenticationThunk());
                },
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.secondaryButton" />
                ),
                onPressSecondaryButton: () => {
                    dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
                },
                secondaryButtonVariant: 'redElevation0',
                icon: 'warningTriangleLight',
                pictogramVariant: 'red',
            });
        }
    }, [dispatch, hasPassphraseMismatchError, navigation, showAlert]);

    return (
        <PassphraseScreenWrapper>
            <VStack
                spacing="large"
                alignItems="center"
                justifyContent="center"
                flex={1}
                padding="small"
            >
                <DeviceT3T1Svg />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                    subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
                />
            </VStack>
        </PassphraseScreenWrapper>
    );
};
