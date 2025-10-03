import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { removeThpAutoconnectThunk } from '@suite-common/thp';
import { selectDeviceAutoconnectCredentials } from '@suite-common/wallet-core';
import { Button, Card, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    DynamicScreenHeader,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useThpAutoconnectActions } from '@suite-native/thp';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

import { useDeviceConnectionGuard } from '../hooks/useDeviceConnectionGuard';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const AutoConnectSettingsScreen = () => {
    const { isDeviceConnected } = useDeviceConnectionGuard();

    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();

    const { showToast } = useToast();
    const { startThpAutoconnect } = useThpAutoconnectActions();

    const autoconnectCredentials = useSelector(selectDeviceAutoconnectCredentials);

    const isAutoconnectEnabled = autoconnectCredentials.length > 0;

    const onAutoconnectTurnOff = useCallback(async () => {
        const result = await dispatch(
            removeThpAutoconnectThunk({
                credentials: autoconnectCredentials,
            }),
        ).unwrap();

        if (isRejected(result)) {
            showToast({
                variant: 'error',
                message: result.error.message,
            });
        }
    }, [dispatch, showToast, autoconnectCredentials]);

    const onAutoconnectTurnOn = useCallback(async () => {
        navigation.navigate(DeviceSettingsStackRoutes.ContinueOnTrezor);

        const result = await startThpAutoconnect();

        if (result && isRejected(result)) {
            TrezorConnect.cancel();
            showToast({
                variant: 'error',
                message: <Translation id="moduleDeviceSettings.autoconnect.enable.error" />,
            });
        } else {
            showToast({
                variant: 'success',
                message: <Translation id="moduleDeviceSettings.autoconnect.enable.successToast" />,
            });
        }
        navigation.goBack();
    }, [navigation, startThpAutoconnect, showToast]);

    const onPress = () => {
        if (isAutoconnectEnabled) {
            onAutoconnectTurnOff();
        } else {
            onAutoconnectTurnOn();
        }
    };

    if (!isDeviceConnected) return null;

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.autoconnect.settingsCard.title" />}
                    subtitle={<Translation id="moduleDeviceSettings.autoconnect.screen.subtitle" />}
                    closeActionType="close"
                />
            }
        >
            <Card>
                <VStack spacing="sp32">
                    <PictogramTitleHeader
                        variant={isAutoconnectEnabled ? 'success' : 'info'}
                        icon={isAutoconnectEnabled ? 'check' : 'x'}
                        title={
                            isAutoconnectEnabled ? (
                                <Translation id="moduleDeviceSettings.autoconnect.enable.pictogramTitle" />
                            ) : (
                                <Translation id="moduleDeviceSettings.autoconnect.disable.pictogramTitle" />
                            )
                        }
                        subtitle={
                            isAutoconnectEnabled ? (
                                <Translation id="moduleDeviceSettings.autoconnect.disable.description" />
                            ) : (
                                <Translation id="moduleDeviceSettings.autoconnect.enable.description" />
                            )
                        }
                    />
                    <Button onPress={onPress} colorScheme="primary" size="medium">
                        {isAutoconnectEnabled ? (
                            <Translation id="moduleDeviceSettings.autoconnect.enable.turnOffButton" />
                        ) : (
                            <Translation id="moduleDeviceSettings.autoconnect.disable.turnOnButton" />
                        )}
                    </Button>
                </VStack>
            </Card>
        </Screen>
    );
};
