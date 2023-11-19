import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    ConnectDeviceStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    acquireDevice,
    selectDeviceRequestedPin,
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceConnectedAndAuthorized,
    selectIsSelectedDeviceImported,
    selectIsUnacquiredDevice,
    selectDeviceModel,
    selectDevice,
    deviceActions,
    selectDeviceFirmwareVersion,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Translation, useTranslate } from '@suite-native/intl';
import { Box, Text, VStack } from '@suite-native/atoms';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';

import { isFirmwareVersionSupported } from '../utils';

const InstallFirmwareAppendix = () => (
    <VStack>
        <Text variant="callout">
            <Translation id="moduleDevice.installFirmware.title" />
        </Text>
        <Box>
            <Text color="textSubdued">
                <Translation id="moduleDevice.installFirmware.lines.1" />
            </Text>
            <Text color="textSubdued">
                <Translation id="moduleDevice.installFirmware.lines.2" />
            </Text>
            <Text color="textSubdued">
                <Translation id="moduleDevice.installFirmware.lines.3" />
            </Text>
        </Box>
    </VStack>
);

type NavigationProps = StackToStackCompositeNavigationProps<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const useDeviceConnect = () => {
    const deviceModel = useSelector(selectDeviceModel);
    const currentDevice = useSelector(selectDevice);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isUnacquiredDevice = useSelector(selectIsUnacquiredDevice);
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);
    const isSelectedDeviceImported = useSelector(selectIsSelectedDeviceImported);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const deviceFwVersion = useSelector(selectDeviceFirmwareVersion);

    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProps>();

    const { hideAlert, showAlert } = useAlert();

    const { translate } = useTranslate();

    const handleDisconnect = useCallback(() => {
        if (currentDevice) {
            dispatch(deviceActions.deviceDisconnect(currentDevice));
        }
    }, [currentDevice, dispatch]);

    const isFirmwareSupported = isFirmwareVersionSupported(deviceFwVersion, deviceModel);

    useEffect(() => {
        if (hasDeviceRequestedPin) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.PinMatrix,
            });
        }
    }, [hasDeviceRequestedPin, navigation]);

    // If device is unacquired (restarted app, another app fetched device session, ...),
    // we cannot work with device anymore. Shouldn't happen on mobile app but just in case.
    useEffect(() => {
        if (isOnboardingFinished && isUnacquiredDevice) {
            showAlert({
                title: translate('moduleDevice.unacquiredDeviceModal.title'),
                description: translate('moduleDevice.unacquiredDeviceModal.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: translate('moduleDevice.unacquiredDeviceModal.button'),
                onPressPrimaryButton: () => dispatch(acquireDevice()),
            });
        } else {
            hideAlert();
        }
    }, [dispatch, hideAlert, isOnboardingFinished, isUnacquiredDevice, showAlert, translate]);

    useEffect(() => {
        if (isOnboardingFinished && !isFirmwareSupported && !isSelectedDeviceImported) {
            showAlert({
                title: translate('moduleDevice.unsupportedFirmware.title'),
                description: translate('moduleDevice.unsupportedFirmware.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: translate('generic.buttons.eject'),
                primaryButtonVariant: 'tertiaryElevation1',
                appendix: <InstallFirmwareAppendix />,
                onPressPrimaryButton: handleDisconnect,
            });
        }
    }, [
        dispatch,
        isFirmwareSupported,
        showAlert,
        translate,
        handleDisconnect,
        isOnboardingFinished,
        isSelectedDeviceImported,
    ]);

    useEffect(() => {
        if (isOnboardingFinished && isConnectedDeviceUninitialized) {
            showAlert({
                title: translate('moduleDevice.noSeedModal.title'),
                description: translate('moduleDevice.noSeedModal.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonVariant: 'tertiaryElevation1',
                primaryButtonTitle: translate('generic.buttons.eject'),
                appendix: <InstallFirmwareAppendix />,
                onPressPrimaryButton: () => handleDisconnect,
            });
        }
    }, [
        isConnectedDeviceUninitialized,
        showAlert,
        translate,
        dispatch,
        handleDisconnect,
        isOnboardingFinished,
    ]);

    useEffect(() => {
        if (isOnboardingFinished && isDeviceConnectedAndAuthorized && !isSelectedDeviceImported) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectingDevice,
            });
        }
    }, [
        hideAlert,
        isDeviceConnectedAndAuthorized,
        isSelectedDeviceImported,
        navigation,
        isOnboardingFinished,
    ]);
};
