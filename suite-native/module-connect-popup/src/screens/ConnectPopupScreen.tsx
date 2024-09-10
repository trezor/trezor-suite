import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import * as Linking from 'expo-linking';

import { Box, Button, Divider, Loader, Text } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import { DeviceManager } from '@suite-native/device-manager';
import {
    selectDevice,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceDiscoveryActive,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import TrezorConnect, { UI_EVENT } from '@trezor/connect';

export const ConnectPopupScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.ConnectPopup>) => {
    const selectedDevice = useSelector(selectDevice);
    const deviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const validDevice = deviceConnectedAndAuthorized && !isPortfolioTrackerDevice;

    const discoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const [callResult, setCallResult] = useState<any>();
    const [loading, setLoading] = useState(false);

    const buildURL = (method: string, params: any, callback: string) => {
        return `trezorsuitelite://connect?method=${method}&params=${encodeURIComponent(
            JSON.stringify(params),
        )}&callback=${encodeURIComponent(callback)}`;
    };

    const callDevice = async () => {
        const { queryParams } = route.params.parsedUrl;
        if (
            !queryParams?.method ||
            !queryParams?.params ||
            !queryParams?.callback ||
            typeof queryParams?.params !== 'string' ||
            typeof queryParams?.method !== 'string' ||
            !TrezorConnect.hasOwnProperty(queryParams?.method)
        ) {
            setCallResult({ error: 'Invalid params' });

            return;
        }
        const body = JSON.parse(queryParams.params);

        setLoading(true);
        // @ts-expect-error method is dynamic
        const response = await TrezorConnect[queryParams.method]({
            ...body,
        });
        setCallResult(response);
        Linking.openURL(queryParams.callback + '?response=' + JSON.stringify(response));
        setLoading(false);
    };

    useEffect(() => {
        const trezorUiEvent = (event: any) => {
            console.log('Trezor UI event', event);
        };

        TrezorConnect.on(UI_EVENT, trezorUiEvent);

        return () => {
            TrezorConnect.off(UI_EVENT, trezorUiEvent);
        };
    }, []);

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    closeActionType="close"
                    content={<Text>Connect Popup Native</Text>}
                />
            }
        >
            <DeviceManager />
            <Box alignItems="center" justifyContent="center" flex={1}>
                <Text>Params: {JSON.stringify(route.params.parsedUrl.queryParams)}</Text>
                <Text>Call result: {JSON.stringify(callResult)}</Text>
                <Text>
                    Device button requests: {JSON.stringify(selectedDevice?.buttonRequests)}
                </Text>

                {validDevice && <Button onPress={() => callDevice()}>Call device</Button>}

                <Divider />

                {discoveryActive && (
                    <Loader size="large" title="Discovery active, please wait :(" />
                )}
                {loading && <Loader size="large" title="Call in progress" />}

                <Divider />

                <Button
                    onPress={() => {
                        Linking.openURL(
                            buildURL(
                                'getAddress',
                                {
                                    path: "m/49'/0'/0'/0/0",
                                    coin: 'btc',
                                },
                                'https://httpbin.org/get',
                            ),
                        );
                    }}
                >
                    getAddress test
                </Button>
                <Button
                    onPress={() => {
                        Linking.openURL(
                            buildURL(
                                'signMessage',
                                {
                                    path: "m/49'/0'/0'/0/0",
                                    coin: 'btc',
                                    message: 'test',
                                },
                                'https://httpbin.org/get',
                            ),
                        );
                    }}
                >
                    signMessage test
                </Button>
            </Box>
        </Screen>
    );
};
