import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeOutDown,
    LinearTransition,
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';

import { Badge, Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    reportCheckFail,
    setTemporaryRememberedDeviceThunk,
    useConfirmOnTrezorController,
} from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { SUITE_LITE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import { DynamicScreenHeader } from '@suite-native/navigation';
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

type FirmwareInstallationScreenContentProps = {
    onFirmwareInstallationSuccess: () => void;
    onFirmwareInstallationFailure?: () => void;
    isRetryAllowed?: boolean;
    isTemporaryRememeberAllowed?: boolean;
    navigationLocation: 'settings' | 'onboarding';
    customHeader?: React.ReactNode;
    onCancelAction?: () => void;
};

// This component is shared between `module-onboarding` and `module-device-settings`.
// Avoid doing anything module specific in this file!!!
export const FirmwareInstallationScreenContent = ({
    onFirmwareInstallationSuccess,
    onFirmwareInstallationFailure,
    onCancelAction,
    customHeader,
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
        setIsInitialFirmwareInstallationRunning,
        isInitialFirmwareInstallationRunning,
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
    const { triggerTransition, confirmOnTrezorRef, isSheetOpen, closeSheet } =
        useConfirmOnTrezorController();
    const openLink = useOpenLink();

    const deviceInternalModel = originalDevice?.features?.internal_model;
    const deviceRevision = originalDevice?.features?.revision;
    const deviceFirmwareVendor = originalDevice?.features?.fw_vendor;

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
        setIsFirmwareInstallationRunning(false);
        TrezorConnect.cancel();
        navigation.goBack();
    }, [navigation, setIsFirmwareInstallationRunning]);

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

        const { versionCheck, bootloaderVersion, binaryVersion, installedVersion, releaseVersion } =
            result.payload;

        if (versionCheck === false) {
            reportCheckFail('Firmware version', {
                model: deviceInternalModel,
                revision: deviceRevision,
                vendor: deviceFirmwareVendor,
                bootloaderVersion,
                binaryVersion,
                installedVersion,
                releaseVersion,
                error: 'Unexpected firmware version change during firmware update.',
            });
        }

        handleAnalyticsReportFinished();
    }, [
        setIsFirmwareInstallationRunning,
        firmwareUpdate,
        handleAnalyticsReportFinished,
        handleAnalyticsReportCancelled,
        onFirmwareInstallationFailure,
        deviceInternalModel,
        deviceRevision,
        deviceFirmwareVendor,
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
        // Preventing from triggering the action again
        setIsInitialFirmwareInstallationRunning(true);

        // Small delay to let initial screen animation finish
        const timeout = setTimeout(() => {
            handleAnalyticsReportStarted({ startType: 'normal' });

            setIsInitialFirmwareInstallationRunning(false);
            startFirmwareUpdate();
        }, 2000);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isError = status === 'error' && !isInitialFirmwareInstallationRunning;
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

    const buttonStyle = applyStyle(bottomButtonsContainerStyle, {
        isConfirmOnDeviceShown: showConfirmOnDevice,
    });

    useEffect(() => {
        if (isSheetOpen && !showConfirmOnDevice) {
            closeSheet();

            return;
        }

        if (showConfirmOnDevice) triggerTransition();
    }, [closeSheet, isSheetOpen, showConfirmOnDevice, triggerTransition]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeAction={onCancelAction ?? handleCancel}
            closeActionType="close"
            defaultHeader={
                customHeader ?? (
                    <DynamicScreenHeader closeActionType="close" closeAction={handleCancel} />
                )
            }
        >
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

            <MayBeStuckedBottomSheet
                isOpened={isMayBeStuckBottomSheetOpened}
                onClose={closeMayBeStuckBottomSheet}
                onAnalyticsReportStucked={handleAnalyticsReportStucked}
            />
        </ConfirmOnTrezorWrapper>
    );
};
