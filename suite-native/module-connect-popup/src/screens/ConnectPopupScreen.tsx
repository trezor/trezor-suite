import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
import { getMethod } from '@trezor/connect/src/core/method';
import { AbstractMethod } from '@trezor/connect/src/core/AbstractMethod';
import { isDevelopOrDebugEnv } from '@suite-native/config';

import { ButtonRequestsOverlay } from '../components/ButtonRequestsOverlay';
import { ConnectPopupDebugOptions } from '../components/ConnectPopupDebugOptions';

const callbackURLOrigin = (fullUrl: string) => {
    const url = new URL(fullUrl);

    return url.origin;
};

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
    const [method, setMethod] = useState<AbstractMethod<any> | undefined>();
    const [methodError, setMethodError] = useState<string | undefined>();

    // TODO: separate this logic
    const popupOptions = useMemo(() => {
        const { queryParams } = route.params.parsedUrl;
        if (
            !queryParams?.method ||
            !queryParams?.params ||
            !queryParams?.callback ||
            typeof queryParams?.params !== 'string' ||
            typeof queryParams?.method !== 'string' ||
            typeof queryParams?.callback !== 'string' ||
            !TrezorConnect.hasOwnProperty(queryParams?.method)
        ) {
            return undefined;
        }
        const params = JSON.parse(queryParams.params);
        const { method: methodName, callback } = queryParams;

        return { method: methodName, params, callback };
    }, [route.params.parsedUrl]);

    useEffect(() => {
        if (!popupOptions?.method) {
            setMethod(undefined);
            setMethodError('No method specified');

            return;
        }

        setMethodError(undefined);
        getMethod({
            id: 0,
            type: 'iframe-call',
            payload: {
                method: popupOptions?.method,
                ...popupOptions?.params,
            },
        })
            .then(async _method => {
                _method.init();
                await _method.initAsync?.();

                if (_method.requiredPermissions.includes('management')) {
                    setMethodError('Unsafe method');

                    return;
                }
                // TODO: refactor to new permission?
                if (
                    popupOptions?.method === 'pushTransaction' ||
                    popupOptions?.params.push === true
                ) {
                    setMethodError('Unsafe to push transaction');

                    return;
                }

                setMethod(_method);
            })
            .catch(e => {
                console.error('Error while getting method', e);
                setMethod(undefined);
                setMethodError(e.message);
            });
    }, [popupOptions?.method, popupOptions?.params]);

    const callDevice = useCallback(async () => {
        if (!popupOptions) return;

        setLoading(true);
        // @ts-expect-error method is dynamic
        const response = await TrezorConnect[popupOptions.method]({
            ...popupOptions.params,
        });
        setCallResult(response);
        dispatch(deviceActions.removeButtonRequests({ device }));
        Linking.openURL(popupOptions.callback + '?response=' + JSON.stringify(response));
        setLoading(false);
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [popupOptions, dispatch, device, navigation]);

    // Listen to Trezor UI events and log them
    /*useEffect(() => {
        const trezorUiEvent = (event: any) => {
            console.log('Trezor UI event', event);
        };

        TrezorConnect.on(UI_EVENT, trezorUiEvent);

        return () => {
            TrezorConnect.off(UI_EVENT, trezorUiEvent);
        };
    }, []);*/

    const mainView = useMemo(() => {
        if (loading) {
            return <Loader size="large" title="Loading..." />;
        }

        if (discoveryActive) {
            return <Loader size="large" title="Discovery running, pls wait :(" />;
        }

        if (validDevice) {
            if (popupOptions && method) {
                return (
                    <VStack spacing="small" alignItems="center">
                        <Text variant="titleSmall">
                            {method.confirmation?.label ?? method.info}
                        </Text>
                        <Text>
                            Callback:{' '}
                            <Text color="textAlertBlue">
                                {callbackURLOrigin(popupOptions?.callback)}
                            </Text>
                        </Text>

                        <Text
                            style={{
                                textAlign: 'center',
                                padding: 20,
                            }}
                            color="textSubdued"
                        >
                            Are you sure you want to continue?{'\n'}
                            Make sure you trust the source.
                        </Text>
                        <Button onPress={callDevice}>
                            {method.confirmation?.customConfirmButton?.label ?? 'Confirm'}
                        </Button>
                    </VStack>
                );
            }
            if (methodError) {
                return <ErrorMessage errorMessage={methodError} />;
            }

            return <Loader size="large" title="Loading..." />;
        }
    }, [validDevice, method, popupOptions, methodError, loading, discoveryActive, callDevice]);

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    closeActionType="close"
                    content={<Text>Trezor Connect Mobile</Text>}
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
