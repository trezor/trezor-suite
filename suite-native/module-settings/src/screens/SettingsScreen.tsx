import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Button, VStack } from '@suite-native/atoms';
import { Screen, StackProps } from '@suite-native/navigation';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { DeviceSettings } from '../components/DeviceSettings';
import { CoinsSettings } from '../components/CoinsSettings';
import { DeviceActionButtons } from '../components/DeviceActionButtons';
import { SettingsStackParamList, SettingsStackRoutes } from '../navigation/routes';

const settingsSectionsStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    padding: utils.spacings.medium,
}));

export const SettingsScreen = ({
    navigation,
}: StackProps<SettingsStackParamList, SettingsStackRoutes.Settings>) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Screen>
            <DeviceActionButtons />
            <VStack spacing="xxl" style={applyStyle(settingsSectionsStyle)}>
                <ApplicationSettings />
                <DeviceSettings />
                <CoinsSettings />
            </VStack>
            {process.env.NODE_ENV === 'development' && (
                <Button onPress={() => navigation.navigate(SettingsStackRoutes.Demo)}>
                    See Component Demo
                </Button>
            )}
        </Screen>
    );
};
