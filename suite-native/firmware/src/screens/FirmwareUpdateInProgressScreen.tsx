import { useCallback, useEffect, useMemo } from 'react';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeOutDown,
    LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { authorizeDeviceThunk } from '@suite-common/wallet-core';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorImage, setDeviceForceRememberedThunk } from '@suite-native/device';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useOpenLink, SUITE_LITE_SUPPORT_URL } from '@suite-native/link';

import {
    UpdateProgressIndicator,
    UpdateProgressIndicatorStatus,
} from '../components/UpdateProgressIndicator';
import { useFirmware } from '../hooks/useFirmware';
type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceStackRoutes.FirmwareUpdateInProgress
>;

const bottomButtonsContainerStyle = prepareNativeStyle<{ bottom: number }>((utils, { bottom }) => ({
    position: 'absolute',
    left: utils.spacings.sp16,
    right: utils.spacings.sp16,
    bottom,
}));

export const FirmwareUpdateInProgressScreen = () => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const { bottom: bottomSafeAreaInset } = useSafeAreaInsets();
    const {
        operation,
        setIsFirmwareInstallationRunning,
        confirmOnDevice,
        firmwareUpdate,
        progress,
        status,
        resetReducer,
        translatedText,
        mayBeStucked,
    } = useFirmware({});
    const openLink = useOpenLink();

    useEffect(() => {
        // This will prevent device from being forgotten after firmware update, so discovery will not run again
        dispatch(setDeviceForceRememberedThunk({ forceRemember: true }));

        return () => {
            dispatch(setDeviceForceRememberedThunk({ forceRemember: false }));
            resetReducer();
        };
    }, [dispatch, resetReducer]);

    const handleFirmwareUpdateFinished = useCallback(() => {
        requestPrioritizedDeviceAccess({
            deviceCallback: () => dispatch(authorizeDeviceThunk()),
        });
        navigation.goBack();
    }, [dispatch, navigation]);

    const startFirmwareUpdate = useCallback(async () => {
        setIsFirmwareInstallationRunning(true);

        const result = await firmwareUpdate();

        if (!result) {
            // some error happened probably, handled in redux, we don't want to navigate anywhere
            return;
        }
        if (!result.success) {
            if (
                // Action cancelled on device
                result.payload?.code === 'Failure_ActionCancelled'
            ) {
                navigation.navigate(DeviceStackRoutes.FirmwareUpdate);
            }

            return;
        }

        // wait few seconds to animation to finish and let user orientate little bit
        setTimeout(() => {
            // setting this to false will trigger standart device connection flow
            setIsFirmwareInstallationRunning(false);
            handleFirmwareUpdateFinished();
        }, 5000);
    }, [
        setIsFirmwareInstallationRunning,
        navigation,
        handleFirmwareUpdateFinished,
        firmwareUpdate,
    ]);

    const handleRetry = useCallback(async () => {
        await TrezorConnect.cancel();
        resetReducer();
        startFirmwareUpdate();
    }, [startFirmwareUpdate, resetReducer]);

    const handleMayBeStucked = useCallback(() => {
        // todo
    }, []);

    const handleContactSupport = useCallback(() => {
        openLink(SUITE_LITE_SUPPORT_URL);
    }, [openLink]);

    useEffect(() => {
        // Small delay to let initial screen animation finish
        const timeout = setTimeout(() => {
            startFirmwareUpdate();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [startFirmwareUpdate]);

    const isError = status === 'error';

    const indicatorStatus: UpdateProgressIndicatorStatus = useMemo(() => {
        const isStarting = (status === 'started' && operation === null) || status === 'initial';
        const isSuccess = operation === 'completed';

        if (isError) return 'error';
        if (isStarting) return 'starting';
        if (isSuccess) return 'success';
        if (!isStarting && !isSuccess && !isError) return 'inProgress';

        // shouldn't happen, but just to be safe
        return 'starting';
    }, [status, operation, isError]);

    const showConfirmOnDevice = confirmOnDevice && !isError;
    const bottomButtonOffset = showConfirmOnDevice ? 180 : bottomSafeAreaInset + 12;

    return (
        <Screen>
            <VStack justifyContent="center" alignItems="center" flex={1}>
                <UpdateProgressIndicator progress={progress} status={indicatorStatus} />
                <Animated.View entering={FadeInUp} exiting={FadeOutDown} key={translatedText.title}>
                    <Box marginTop="sp12" alignItems="center">
                        <Text variant="titleMedium" textAlign="center">
                            {translatedText.title}
                        </Text>
                    </Box>
                    <Box marginTop="sp8" alignItems="center">
                        <Text variant="body" color="textSubdued" textAlign="center">
                            {translatedText.subtitle ?? ' '}
                        </Text>
                    </Box>
                </Animated.View>
            </VStack>
            {isError && (
                <VStack
                    spacing="sp12"
                    style={applyStyle(bottomButtonsContainerStyle, {
                        bottom: bottomButtonOffset,
                    })}
                >
                    <Button onPress={handleRetry} colorScheme="redBold">
                        <Translation id="moduleDeviceSettings.firmware.firmwareUpdateProgress.retryButton" />
                    </Button>
                    <Button onPress={handleContactSupport} colorScheme="tertiaryElevation0">
                        <Translation id="moduleDeviceSettings.firmware.firmwareUpdateProgress.contactSupportButton" />
                    </Button>
                </VStack>
            )}
            {mayBeStucked && (
                <Animated.View
                    entering={FadeInDown}
                    exiting={FadeOutDown}
                    layout={LinearTransition}
                    style={applyStyle(bottomButtonsContainerStyle, {
                        bottom: bottomButtonOffset,
                    })}
                >
                    <Button onPress={handleMayBeStucked} colorScheme="tertiaryElevation0">
                        <Translation id="moduleDeviceSettings.firmware.firmwareUpdateProgress.stuckButton" />
                    </Button>
                </Animated.View>
            )}
            {showConfirmOnDevice && (
                <ConfirmOnTrezorImage
                    bottomSheetText={
                        <Translation id="moduleDeviceSettings.firmware.firmwareUpdateProgress.confirmOnDeviceMessage" />
                    }
                />
            )}
        </Screen>
    );
};
