import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { SettingsStackRoutes, SettingsStackParamList } from '../navigation/routes';
import { StackProps } from '@suite-native/navigation';

import { Box, Button } from '@suite-native/atoms';
import { ApplicationSettings } from '../components/ApplicationSettings';
import { DeviceSettings } from '../components/DeviceSettings';
import { CoinsSettings } from '../components/CoinsSettings';
import { ActionButtons } from '../components/ActionButtons';

const settingsScreenStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    padding: utils.spacings.medium,
}));

export const SettingsScreen = ({
    navigation,
}: StackProps<SettingsStackParamList, SettingsStackRoutes.Settings>) => {
    const { applyStyle } = useNativeStyles();

    return (
        <ScrollView>
            <Box style={applyStyle(settingsScreenStyle)}>
                <Button
                    onPress={() =>
                        navigation.navigate(SettingsStackRoutes.SettingsDetail, {
                            message: 'this is detail',
                        })
                    }
                    size="medium"
                    colorScheme="primary"
                >
                    Show detail
                </Button>
                <ActionButtons />
                <ApplicationSettings />
                <DeviceSettings />
                <CoinsSettings />
            </Box>
        </ScrollView>
    );
};
