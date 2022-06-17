import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { StackProps } from '@suite-native/navigation';
import { VStack } from '@suite-native/atoms';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { DeviceSettings } from '../components/DeviceSettings';
import { CoinsSettings } from '../components/CoinsSettings';
import { ActionButtons } from '../components/ActionButtons';
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

    const handleRedirect = (route: SettingsStackRoutes | undefined) => {
        if (!route) return;
        navigation?.navigate(route);
    };

    return (
        <ScrollView>
            <ActionButtons />
            <VStack spacing="XXL" style={applyStyle(settingsSectionsStyle)}>
                <ApplicationSettings onRedirect={handleRedirect} />
                <DeviceSettings />
                <CoinsSettings />
            </VStack>
        </ScrollView>
    );
};
