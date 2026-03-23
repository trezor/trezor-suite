import React, { useCallback, useEffect, useMemo } from 'react';
import Animated, { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';

import { firmwareActions } from '@suite-common/firmware';
import { Box, Button, VStack, useBottomSheetModal } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import { SUITE_MOBILE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import { DynamicScreenHeader } from '@suite-native/navigation';
import { reportSecurityCheck } from '@suite-native/sentry';
import TrezorConnect from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { setTemporaryRememberedDeviceThunk } from '../firmwareThunks';
import { DoNotCloseAppBottomSheetTrigger } from './DoNotCloseAppBottomSheetTrigger';
import { FirmwareInstallationProgressTitles } from './FirmwareInstallationProgressTitles';
import { MayBeStuckedBottomSheet } from './MayBeStuckedBottomSheet';
import { TrezorFacts } from './TrezorFacts';
import {
    UpdateProgressIndicator,
    type UpdateProgressIndicatorStatus,
} from './UpdateProgressIndicator';
import { useFirmware } from '../hooks/useFirmware';
import { useFirmwareAnalytics } from '../hooks/useFirmwareAnalytics';

const bottomButtonsContainerStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    width: '100%',
    bottom: 0,
}));

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

    const {
        bottomSheetRef,
        openModal,
        closeModal: closeMayBeStuckBottomSheet,
    } = useBottomSheetModal();

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
    const { revealConfirmOnTrezorSheet, confirmOnTrezorRef, isSheetOpen, closeSheet } =
        useConfirmOnTrezorController();
    const openLink = useOpenLink();

    const deviceInternalModel = originalDevice?.features?.internal_model;
    const deviceRevision = originalDevice?.features?.revision;
    const deviceFirmwareVendor = originalDevice?.features?.fw_vendor;

    const openMayBeStuckBottomSheet = () => {
        handleAnalyticsReportStucked('modalPart1');
        openModal();
    };

    useEffect(() => {
        // On the first render, set the firmware installation status to 'initial'. A firmware update might have
        // happened before, and we want to avoid showing any previous result when user returns to this screen.
        dispatch(firmwareActions.setStatus('initial'));
    }, [dispatch]);

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
        if (status !== 'thp-pairing') {
            setIsFirmwareInstallationRunning(false);
        }
        onFirmwareInstallationSuccess();
    }, [status, onFirmwareInstallationSuccess, setIsFirmwareInstallationRunning]);

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
                result.error?.code === 'Failure_ActionCancelled'
            ) {
                handleAnalyticsReportCancelled();
                onFirmwareInstallationFailure?.();

                return;
            }

            handleAnalyticsReportFinished({ error: result.error?.message ?? 'Unknown error' });

            return;
        }

        const { versionCheck, bootloaderVersion, binaryVersion, installedVersion, releaseVersion } =
            result.payload;

        if (versionCheck === false) {
            reportSecurityCheck({
                level: 'error',
                checkType: 'Firmware version',
                contextData: {
                    model: deviceInternalModel,
                    revision: deviceRevision,
                    vendor: deviceFirmwareVendor,
                    bootloaderVersion,
                    binaryVersion,
                    installedVersion,
                    releaseVersion,
                    error: 'Unexpected firmware version change during firmware update.',
                },
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

    const handleContactSupport = useCallback(() => {
        openLink(SUITE_MOBILE_SUPPORT_URL);
    }, [openLink]);

    useEffect(() => {
        // Small delay to let initial screen animation finish
        const timeout = setTimeout(() => {
            handleAnalyticsReportStarted({ startType: 'normal' });

            startFirmwareUpdate();
        }, 2000);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isError = status === 'error';
    const isDone = status === 'thp-pairing' || status === 'done' || operation === 'completed';

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

    const indicatorProgress = useMemo(() => {
        switch (indicatorStatus) {
            case 'error':
            case 'starting':
                return 0;
            case 'success':
                return 100;
            case 'inProgress':
            default:
                return progress;
        }
    }, [progress, indicatorStatus]);

    const showConfirmOnDevice = confirmOnDevice && !isError && !isDone;

    const buttonStyle = applyStyle(bottomButtonsContainerStyle);

    useEffect(() => {
        if (isSheetOpen && !showConfirmOnDevice) {
            closeSheet();

            return;
        }

        if (showConfirmOnDevice) revealConfirmOnTrezorSheet();
    }, [closeSheet, isSheetOpen, showConfirmOnDevice, revealConfirmOnTrezorSheet]);

    const CancelButton = customHeader ?? (
        <DynamicScreenHeader closeActionType="close" closeAction={handleCancel} />
    );

    const isDontCloseAppAlertDisplayed =
        indicatorStatus === 'inProgress' && !isSheetOpen && !mayBeStucked && !isDone;

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeAction={onCancelAction ?? handleCancel}
            closeActionType="close"
            defaultHeader={isError && CancelButton}
            isCloseButtonDisabled
        >
            <Box flex={1}>
                <VStack justifyContent="center" alignItems="center" flex={1}>
                    <UpdateProgressIndicator
                        status={indicatorStatus}
                        progress={indicatorProgress}
                    />
                    {operation === 'installing' ? (
                        <TrezorFacts />
                    ) : (
                        <FirmwareInstallationProgressTitles
                            title={translatedText.title}
                            subtitle={translatedText.subtitle}
                        />
                    )}
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
                        <Button
                            onPress={openMayBeStuckBottomSheet}
                            colorScheme="tertiaryElevation0"
                        >
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
                <DoNotCloseAppBottomSheetTrigger
                    isTriggerDisplayed={isDontCloseAppAlertDisplayed}
                />
            </Box>

            <MayBeStuckedBottomSheet
                ref={bottomSheetRef}
                onClose={closeMayBeStuckBottomSheet}
                onAnalyticsReportStucked={handleAnalyticsReportStucked}
            />
        </ConfirmOnTrezorWrapper>
    );
};
