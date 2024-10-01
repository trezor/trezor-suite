import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo, useState } from 'react';

import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { Box, Button, ErrorMessage, IconButton, Loader, Text, VStack } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import { DeviceManager } from '@suite-native/device-manager';
import {
    deviceActions,
    selectDevice,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceDiscoveryActive,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Translation } from '@suite-native/intl';

import { ButtonRequestsOverlay } from '../components/ButtonRequestsOverlay';
import { ConnectPopupDebugOptions } from '../components/ConnectPopupDebugOptions';
import { useConnectMethod } from '../hooks/useConnectMethod';
import { useConnectParseParams } from '../hooks/useConnectParseParams';
import { callbackURLOrigin } from '../utils/callbackURLOrigin';

export const ConnectPopupScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.ConnectPopup>) => {
    const navigation = useNavigation();

    const dispatch = useDispatch();
    const device = useSelector(selectDevice);
    const deviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const validDevice = deviceConnectedAndAuthorized && !isPortfolioTrackerDevice;
    const discoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const [showDebug, setShowDebug] = useState<boolean>(false);
    const [callResult, setCallResult] = useState<any>();
    const [loading, setLoading] = useState(false);

    const popupOptions = useConnectParseParams(route.params.parsedUrl);
    const { method, methodError } = useConnectMethod(popupOptions);

    const callDevice = useCallback(async () => {
        if (!popupOptions) return;

        setLoading(true);
        // @ts-expect-error method is dynamic
        const response = await TrezorConnect[popupOptions.method]({
            ...popupOptions.params,
        });
        setCallResult(response);
        dispatch(deviceActions.removeButtonRequests({ device }));
        const callbackUrl = new URL(popupOptions.callback);
        callbackUrl.searchParams.set('response', JSON.stringify(response));
        Linking.openURL(callbackUrl.toString());
        setLoading(false);
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [popupOptions, dispatch, device, navigation]);

    const mainView = useMemo(() => {
        if (loading) {
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
            if (popupOptions && method) {
                const callbackOrigin = callbackURLOrigin(popupOptions?.callback);
                if (!callbackOrigin) {
                    return (
                        <ErrorMessage
                            errorMessage={
                                <Translation id="moduleConnectPopup.errors.invalidCallback" />
                            }
                        />
                    );
                }

                return (
                    <VStack spacing="sp8" alignItems="center">
                        <Text variant="titleSmall">
                            {method.confirmation?.label ?? method.info}
                        </Text>
                        <Text>
                            <Translation id="moduleConnectPopup.callback" />
                            {': '}
                            <Text color="textAlertBlue">{callbackOrigin}</Text>
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
                        <Button onPress={callDevice}>
                            {method.confirmation?.customConfirmButton?.label ?? (
                                <Translation id="moduleConnectPopup.confirm" />
                            )}
                        </Button>
                    </VStack>
                );
            }
            if (methodError) {
                return <ErrorMessage errorMessage={methodError} />;
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
    }, [validDevice, method, popupOptions, methodError, loading, discoveryActive, callDevice]);

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
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

            <ConnectPopupDebugOptions showDebug={showDebug} setShowDebug={setShowDebug}>
                <Text>Device: {JSON.stringify(device, null, 2)}</Text>
                <Text>Params: {JSON.stringify(route.params.parsedUrl.queryParams)}</Text>
                <Text>Call result: {JSON.stringify(callResult)}</Text>
            </ConnectPopupDebugOptions>
        </Screen>
    );
};
