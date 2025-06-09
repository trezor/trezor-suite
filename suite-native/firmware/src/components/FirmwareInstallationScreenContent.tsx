import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOutDown,
    LinearTransition,
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';

import { Badge, Box, Button, IconButton, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorImage, setTemporaryRememberedDeviceThunk } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { SUITE_LITE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import TrezorConnect from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { MayBeStuckedBottomSheet } from './MayBeStuckedBottomSheet';
import { UpdateProgressIndicator, UpdateProgressIndicatorStatus } from './UpdateProgressIndicator';
import { useFirmware } from '../hooks/useFirmware';
import { useFirmwareAnalytics } from '../hooks/useFirmwareAnalytics';

const bottomButtonsContainerStyle = prepareNativeStyle<{ isConfirmOnDeviceShown: boolean }>(
    (utils, { isConfirmOnDeviceShown }) => ({
        position: 'absolute',
        left: utils.spacings.sp16,
        right: utils.spacings.sp16,
        bottom: isConfirmOnDeviceShown ? 180 : 0,
    }),
);

const cancelButtonStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    left: utils.spacings.sp8,
    top: utils.spacings.sp8,
}));

type FirmwareInstallationScreenContentProps = {
    onFirmwareInstallationSuccess: () => void;
    onFirmwareInstallationFailure?: () => void;
    isCancellationAllowed?: boolean;
    isRetryAllowed?: boolean;
    isTemporaryRememeberAllowed?: boolean;
    navigationLocation: 'settings' | 'onboarding';
};

// This component is shared between `module-onboarding` and `module-device-settings`.
// Avoid doing anything module specific in this file!!!
export const FirmwareInstallationScreenContent = ({
    onFirmwareInstallationSuccess,
    onFirmwareInstallationFailure,
    isCancellationAllowed = true,
    isRetryAllowed = true,
    isTemporaryRememeberAllowed = true,
    navigationLocation,
}: FirmwareInstallationScreenContentProps) => {
    useKeepAwake(); // Prevents screen from sleeping while installing firmware (might take few minutes).

    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation();
    const [isMayBeStuckBottomSheetOpened, setIsMayBeStuckBottomSheetOpened] =
        useState<boolean>(false);
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
        originalDevice,
        targetFirmwareType,
    } = useFirmware({ navigationLocation });
    const {
        handleAnalyticsReportFinished,
        handleAnalyticsReportStucked,
        handleAnalyticsReportCancelled,
        handleAnalyticsReportStarted,
    } = useFirmwareAnalytics({
        device: originalDevice,
        targetFirmwareType,
        navigationLocation,
    });
    const openLink = useOpenLink();

    useEffect(() => {
        if (!isTemporaryRememeberAllowed) return;

        // This will prevent device from being forgotten after firmware update, so discovery will not run again
        dispatch(setTemporaryRememberedDeviceThunk({ temporaryRemember: true }));

        return () => {
            dispatch(setTemporaryRememberedDeviceThunk({ temporaryRemember: false }));
            resetReducer();
            setIsFirmwareInstallationRunning(false);
        };
    }, [dispatch, isTemporaryRememeberAllowed, resetReducer, setIsFirmwareInstallationRunning]);

    const handleFirmwareUpdateFinished = useCallback(() => {
        console.warn(
            'FirmwareInstallationScreenContent: handleFirmwareUpdateFinished = authorize device thunk need to be replaced here',
        );

        setIsFirmwareInstallationRunning(false);
        onFirmwareInstallationSuccess();
    }, [onFirmwareInstallationSuccess, setIsFirmwareInstallationRunning]);

    const handleCancel = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const startFirmwareUpdate = useCallback(async () => {
        setIsFirmwareInstallationRunning(true);
        const result = await firmwareUpdate();

        if (!result) {
            handleAnalyticsReportFinished({ error: 'Unknown error swallowed by redux.' });

            // some error happened probably, handled in redux, we don't want to navigate anywhere
            return;
        }
        if (!result.success) {
            if (
                // Action cancelled on device
                result.payload?.code === 'Failure_ActionCancelled'
            ) {
                handleAnalyticsReportCancelled();
                onFirmwareInstallationFailure?.();

                return;
            }

            handleAnalyticsReportFinished({ error: result.payload?.error ?? 'Unknown error' });

            return;
        }

        handleAnalyticsReportFinished();
    }, [
        setIsFirmwareInstallationRunning,
        onFirmwareInstallationFailure,
        firmwareUpdate,
        handleAnalyticsReportFinished,
        handleAnalyticsReportCancelled,
    ]);

    const handleRetry = useCallback(async () => {
        await TrezorConnect.cancel();
        // We should put retry before resetReducer because then we may not have information about the device
        handleAnalyticsReportStarted({ startType: 'retry' });
        resetReducer();
        startFirmwareUpdate();
    }, [startFirmwareUpdate, resetReducer, handleAnalyticsReportStarted]);

    const openMayBeStuckBottomSheet = useCallback(() => {
        setIsMayBeStuckBottomSheetOpened(true);
    }, []);

    const closeMayBeStuckBottomSheet = useCallback(() => {
        setIsMayBeStuckBottomSheetOpened(false);
    }, []);

    const handleContactSupport = useCallback(() => {
        openLink(SUITE_LITE_SUPPORT_URL);
    }, [openLink]);

    useEffect(() => {
        // Small delay to let initial screen animation finish
        const timeout = setTimeout(() => {
            handleAnalyticsReportStarted({ startType: 'normal' });
            startFirmwareUpdate();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [startFirmwareUpdate, handleAnalyticsReportStarted]);

    const isError = status === 'error';
    const isDone = status === 'done';

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

    const showConfirmOnDevice = confirmOnDevice && !isError && !isDone;
    const isCancelButtonDisplayed = isCancellationAllowed && isError;

    const buttonStyle = applyStyle(bottomButtonsContainerStyle, {
        isConfirmOnDeviceShown: showConfirmOnDevice,
    });

    return (
        <>
            {isCancelButtonDisplayed && (
                <Animated.View entering={FadeIn} style={applyStyle(cancelButtonStyle)}>
                    <IconButton
                        iconName="x"
                        size="medium"
                        colorScheme="tertiaryElevation0"
                        accessibilityRole="button"
                        accessibilityLabel="close"
                        onPress={handleCancel}
                    />
                </Animated.View>
            )}
            <VStack justifyContent="center" alignItems="center" flex={1}>
                <UpdateProgressIndicator progress={progress} status={indicatorStatus} />
                <Animated.View entering={FadeInUp} exiting={FadeOutDown} key={translatedText.title}>
                    <Box marginTop="sp12" alignItems="center">
                        <Text variant="titleSmall" textAlign="center">
                            {translatedText.title}
                        </Text>
                    </Box>
                    <Box marginTop="sp8" alignItems="center">
                        <Text variant="body" color="textSubdued" textAlign="center">
                            {translatedText.subtitle ?? ' '}
                        </Text>
                    </Box>
                    {!isError && !isDone && (
                        <Box paddingTop="sp24" alignItems="center" justifyContent="center">
                            <Badge
                                variant="blue"
                                label={
                                    <Translation id="firmware.firmwareUpdateProgress.dontCloseAppMessage" />
                                }
                            />
                        </Box>
                    )}
                </Animated.View>
            </VStack>
            {isError && (
                <VStack spacing="sp12" style={buttonStyle}>
                    {isRetryAllowed && (
                        <Button onPress={handleRetry} colorScheme="redBold">
                            <Translation id="firmware.firmwareUpdateProgress.retryButton" />
                        </Button>
                    )}
                    <Button onPress={handleContactSupport} colorScheme="tertiaryElevation0">
                        <Translation id="firmware.firmwareUpdateProgress.contactSupportButton" />
                    </Button>
                </VStack>
            )}
            {mayBeStucked && (
                <Animated.View
                    entering={FadeInDown}
                    exiting={FadeOutDown}
                    layout={LinearTransition}
                    style={buttonStyle}
                >
                    <Button onPress={openMayBeStuckBottomSheet} colorScheme="tertiaryElevation0">
                        <Translation id="firmware.firmwareUpdateProgress.stuckButton" />
                    </Button>
                </Animated.View>
            )}
            {isDone && (
                <Animated.View
                    entering={FadeInDown}
                    exiting={FadeOutDown}
                    layout={LinearTransition}
                    style={buttonStyle}
                >
                    <Button onPress={handleFirmwareUpdateFinished}>
                        <Translation id="generic.buttons.continue" />
                    </Button>
                </Animated.View>
            )}
            {showConfirmOnDevice && (
                <ConfirmOnTrezorImage
                    bottomSheetText={
                        <Translation id="firmware.firmwareUpdateProgress.confirmOnDeviceMessage" />
                    }
                />
            )}
            <MayBeStuckedBottomSheet
                isOpened={isMayBeStuckBottomSheetOpened}
                onClose={closeMayBeStuckBottomSheet}
                onAnalyticsReportStucked={handleAnalyticsReportStucked}
            />
        </>
    );
};
