import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '@suite-native/atoms';
import { ApplicationSettings } from '../components/ApplicationSettings';
import { DeviceSettings } from '../components/DeviceSettings';
import { CoinsSettings } from '../components/CoinsSettings';
import { ActionButtons } from '../components/ActionButtons';

const settingsSectionsStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    padding: utils.spacings.medium,
}));

export const SettingsScreen = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <ScrollView>
            <ActionButtons />
            <Box style={applyStyle(settingsSectionsStyle)}>
                <ApplicationSettings />
                <DeviceSettings />
                <CoinsSettings />
            </Box>
        </ScrollView>
    );
};
