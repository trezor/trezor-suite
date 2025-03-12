import { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOutDown,
    LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { authorizeDeviceThunk } from '@suite-common/wallet-core';
import { Box, Button, IconButton, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorImage, setDeviceForceRememberedThunk } from '@suite-native/device';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation } from '@suite-native/intl';
import { SUITE_LITE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import TrezorConnect from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { MayBeStuckedBottomSheet } from '../components/MayBeStuckedBottomSheet';
import {
    UpdateProgressIndicator,
    UpdateProgressIndicatorStatus,
} from '../components/UpdateProgressIndicator';
import { useFirmware } from '../hooks/useFirmware';
import { useFirmwareAnalytics } from '../hooks/useFirmwareAnalytics';

const bottomButtonsContainerStyle = prepareNativeStyle<{ bottom: number }>((utils, { bottom }) => ({
    position: 'absolute',
    left: utils.spacings.sp16,
    right: utils.spacings.sp16,
    bottom,
}));

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
};

// This component is shared between `module-onboarding` and `module-device-settings`.
// Avoid doing anything module specific in this file!!!
export const FirmwareInstallationScreenContent = ({
    onFirmwareInstallationSuccess,
    onFirmwareInstallationFailure,
    isCancellationAllowed = true,
    isRetryAllowed = true,
}: FirmwareInstallationScreenContentProps) => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation();
    const [isMayBeStuckBottomSheetOpened, setIsMayBeStuckBottomSheetOpened] =
        useState<boolean>(false);
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
        originalDevice,
        targetFirmwareType,
    } = useFirmware({});
    const {
        handleAnalyticsReportFinished,
        handleAnalyticsReportStucked,
        handleAnalyticsReportCancelled,
        handleAnalyticsReportStarted,
    } = useFirmwareAnalytics({
        device: originalDevice,
        targetFirmwareType,
    });
    const openLink = useOpenLink();

    useEffect(() => {
        // This will prevent device from being forgotten after firmware update, so discovery will not run again
        dispatch(setDeviceForceRememberedThunk({ forceRemember: true }));

        return () => {
            dispatch(setDeviceForceRememberedThunk({ forceRemember: false }));
            resetReducer();
        };
    }, [dispatch, resetReducer]);

    const handleFirmwareUpdateFinished = useCallback(async () => {
        await requestPrioritizedDeviceAccess({
            deviceCallback: () => dispatch(authorizeDeviceThunk()),
        });

        setIsFirmwareInstallationRunning(false);
        onFirmwareInstallationSuccess();
    }, [dispatch, onFirmwareInstallationSuccess, setIsFirmwareInstallationRunning]);

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

    const showConfirmOnDevice = confirmOnDevice && !isError;
    const isCancelButtonDisplayed = isCancellationAllowed && isError;
    const bottomButtonOffset = showConfirmOnDevice ? 180 : bottomSafeAreaInset + 12;

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
                </Animated.View>
            </VStack>
            {isError && (
                <VStack
                    spacing="sp12"
                    style={applyStyle(bottomButtonsContainerStyle, {
                        bottom: bottomButtonOffset,
                    })}
                >
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
                    style={applyStyle(bottomButtonsContainerStyle, {
                        bottom: bottomButtonOffset,
                    })}
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
                    style={applyStyle(bottomButtonsContainerStyle, {
                        bottom: bottomButtonOffset,
                    })}
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
