import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/device';
import { useAlert } from '@suite-native/alerts';
import { Box, TitleHeader, VStack } from '@suite-native/atoms';
import { ConnectorImage } from '@suite-native/device';
import { DevicePinImage, usePinAction } from '@suite-native/device-authorization';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';

import { useOnDeviceOnboardingFinishedNavigation } from '../hooks/useOnDeviceOnboardingFinishedNavigation';
import { useReportOnboardingSuccessAnalytics } from '../hooks/useReportOnboardingSuccessAnalytics';

const SCREEN_HEIGHT = getScreenHeight();

export const CreatePinScreen = () => {
    const deviceModel = useSelector(selectDeviceModel);

    const reportOnboardingSuccessAnalytics = useReportOnboardingSuccessAnalytics();

    const { showAlert } = useAlert();
    const { onDeviceOnboardingFinishedNavigation } = useOnDeviceOnboardingFinishedNavigation();

    const handlePinCreated = useCallback(() => {
        onDeviceOnboardingFinishedNavigation();
        reportOnboardingSuccessAnalytics();
    }, [onDeviceOnboardingFinishedNavigation, reportOnboardingSuccessAnalytics]);

    const handlePinCanceled = useCallback(
        (_: TxKeyPath, tryAgainAction: () => void) => {
            showAlert({
                title: (
                    <Translation id="moduleDeviceOnboarding.createPinScreen.cancelAlert.title" />
                ),
                description: (
                    <Translation id="moduleDeviceOnboarding.createPinScreen.cancelAlert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="moduleDeviceOnboarding.createPinScreen.cancelAlert.cancelButton" />
                ),
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                secondaryButtonTitle: (
                    <Translation id="moduleDeviceOnboarding.createPinScreen.cancelAlert.retryButton" />
                ),
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                onPressSecondaryButton: tryAgainAction,
                onPressPrimaryButton: () => {
                    handlePinCreated();
                },
            });
        },
        [showAlert, handlePinCreated],
    );

    usePinAction({
        type: 'enable',
        onSuccess: handlePinCreated,
        onError: handlePinCanceled,
    });

    const onCancel = () => {
        TrezorConnect.cancel();
    };

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" closeAction={onCancel} />}
            isScrollable={false}
            noBottomPadding={true}
            hasBottomInset={false}
        >
            <VStack flex={1} marginTop="sp32" spacing="sp24">
                <TitleHeader
                    titleVariant="headline-md"
                    title={<Translation id="moduleDeviceOnboarding.createPinScreen.title" />}
                    subtitle={<Translation id="moduleDeviceOnboarding.createPinScreen.subtitle" />}
                    textAlign="center"
                />
                <Box flex={1} justifyContent="flex-end">
                    <DevicePinImage
                        deviceModel={deviceModel || DeviceModelInternal.UNKNOWN}
                        maxHeight={0.42 * SCREEN_HEIGHT}
                    />
                    <ConnectorImage maxHeight={0.18 * SCREEN_HEIGHT} />
                </Box>
            </VStack>
        </Screen>
    );
};
