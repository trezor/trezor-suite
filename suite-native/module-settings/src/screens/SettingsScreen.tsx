import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { DeviceSettings } from '../components/DeviceSettings';
import { CoinsSettings } from '../components/CoinsSettings';
import { DeviceActionButtons } from '../components/DeviceActionButtons';

const settingsSectionsStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    padding: utils.spacings.medium,
}));

export const SettingsScreen = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Screen>
            <DeviceActionButtons />
            <VStack spacing="xxl" style={applyStyle(settingsSectionsStyle)}>
                <ApplicationSettings />
                <DeviceSettings />
                <CoinsSettings />
            </VStack>
        </Screen>
    );
};
