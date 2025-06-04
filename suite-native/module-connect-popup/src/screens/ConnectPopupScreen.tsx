import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import {
    selectHasRunningDiscovery,
    selectIsDeviceConnectedAndAuthorized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Box, Button, ErrorMessage, IconButton, Loader, Text, VStack } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { DeviceManager } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { ButtonRequestsOverlay } from '../components/ButtonRequestsOverlay';

export const ConnectPopupScreen = () => {
    const navigation = useNavigation();

    const dispatch = useDispatch();
    const deviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const validDevice = deviceConnectedAndAuthorized && !isPortfolioTrackerDevice;
    const discoveryActive = useSelector(selectHasRunningDiscovery);
    const popupCall = useSelector(selectConnectPopupCall);
    const [showDebug, setShowDebug] = useState<boolean>(false);

    useEffect(() => {
        if (popupCall?.state == 'finished' && navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [popupCall, navigation]);

    const mainView = useMemo(() => {
        const onConfirm = () => dispatch(connectPopupActions.approvePermissions());

        if (!popupCall) {
            return (
                <Loader
                    size="large"
                    title={<Translation id="moduleConnectPopup.connectionStatus.loading" />}
                />
            );
        }

        if (discoveryActive) {
            return (
                <Loader
                    size="large"
                    title={
                        <Translation id="moduleConnectPopup.connectionStatus.discoveryRunning" />
                    }
                />
            );
        }

        if (validDevice) {
            if (popupCall.state === 'permission-request') {
                if (!popupCall.source.origin) {
                    return (
                        <ErrorMessage
                            errorMessage={
                                <Translation id="moduleConnectPopup.errors.invalidCallback" />
                            }
                        />
                    );
                }

                return (
                    <VStack testID="@popup/deeplink-info" spacing="sp8" alignItems="center">
                        <Text variant="titleSmall">{popupCall.methodInfo.methodTitle}</Text>
                        <Text>
                            <Translation id="moduleConnectPopup.callback" />
                            {': '}
                            <Text color="textAlertBlue">{popupCall.source.origin}</Text>
                        </Text>

                        <Text
                            style={{
                                textAlign: 'center',
                                padding: 20,
                            }}
                            color="textSubdued"
                        >
                            <Translation id="moduleConnectPopup.areYouSureMessage" />
                        </Text>
                        <Button testID="@popup/call-device" onPress={onConfirm}>
                            {popupCall.methodInfo.confirmLabel || (
                                <Translation id="moduleConnectPopup.confirm" />
                            )}
                        </Button>
                    </VStack>
                );
            }

            if (popupCall.state === 'call-error') {
                const getTranslationId = () => {
                    switch (popupCall.error.code) {
                        case 'Deeplink_VersionMismatch':
                            return 'moduleConnectPopup.errors.versionUnsupported';
                        case 'Method_NotAllowed':
                            return 'moduleConnectPopup.errors.methodNotAllowed';
                        case 'Device_NotFound':
                            return 'moduleConnectPopup.errors.deviceNotConnected';
                        default:
                            return 'moduleConnectPopup.errors.invalidParams';
                    }
                };

                return <ErrorMessage errorMessage={<Translation id={getTranslationId()} />} />;
            }

            return (
                <Loader
                    size="large"
                    title={<Translation id="moduleConnectPopup.connectionStatus.loading" />}
                />
            );
        } else {
            return (
                <Loader
                    size="large"
                    title={<Translation id="moduleConnectPopup.errors.deviceNotConnected" />}
                />
            );
        }
    }, [validDevice, popupCall, discoveryActive, dispatch]);

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="close"
                    content={
                        <Text>
                            <Translation id="moduleConnectPopup.title" />
                        </Text>
                    }
                    rightIcon={
                        isDevelopOrDebugEnv() ? (
                            <IconButton
                                iconName="bugBeetle"
                                onPress={() => setShowDebug(!showDebug)}
                                colorScheme="tertiaryElevation0"
                                size="medium"
                            />
                        ) : null
                    }
                />
            }
        >
            <Box>
                <DeviceManager />
            </Box>

            <Box alignItems="center" justifyContent="center" flex={1}>
                {mainView}
            </Box>

            <ButtonRequestsOverlay />
        </Screen>
    );
};
