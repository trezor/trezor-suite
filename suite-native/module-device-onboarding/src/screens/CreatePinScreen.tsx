import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { selectDeviceModel, selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Box, TitleHeader, VStack } from '@suite-native/atoms';
import { ConnectorImage, usePinAction } from '@suite-native/device';
import { DevicePinImage } from '@suite-native/device-authorization';
import { Translation, TxKeyPath } from '@suite-native/intl';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';
import TrezorConnect from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';

import { useReportOnboardingSuccessAnalytics } from '../hooks/useReportOnboardingSuccessAnalytics';

const SCREEN_HEIGHT = getScreenHeight();

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.CreatePin,
    RootStackParamList
>;

export const CreatePinScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const deviceModel = useSelector(selectDeviceModel);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isCoinEnablingInitFinished = useSelector(selectIsCoinEnablingInitFinished);
    const { showAlert, hideAlert } = useAlert();
    const reportOnboardingSuccessAnalytics = useReportOnboardingSuccessAnalytics();

    const handlePinCreated = useCallback(() => {
        if (hasBitcoinOnlyFirmware || isCoinEnablingInitFinished) {
            navigation.popTo(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        } else {
            navigation.popTo(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
            });
        }
        reportOnboardingSuccessAnalytics();
    }, [
        hasBitcoinOnlyFirmware,
        isCoinEnablingInitFinished,
        navigation,
        reportOnboardingSuccessAnalytics,
    ]);

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
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: (
                    <Translation id="moduleDeviceOnboarding.createPinScreen.cancelAlert.retryButton" />
                ),
                secondaryButtonVariant: 'redElevation0',
                onPressSecondaryButton: tryAgainAction,
                onPressPrimaryButton: () => {
                    hideAlert();
                    handlePinCreated();
                },
            });
        },
        [showAlert, hideAlert, handlePinCreated],
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
            header={<ScreenHeader closeAction={onCancel} />}
            isScrollable={false}
            noBottomPadding={true}
            hasBottomInset={false}
        >
            <VStack flex={1} marginTop="sp32" spacing="sp24">
                <TitleHeader
                    titleVariant="titleMedium"
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
