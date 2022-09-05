import React from 'react';

import { Button, VStack } from '@suite-native/atoms';
import {
    Screen,
    SettingsStackParamList,
    SettingsStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { DeviceSettings } from '../components/DeviceSettings';
import { CoinsSettings } from '../components/CoinsSettings';
import { DeviceActionButtons } from '../components/DeviceActionButtons';

export const SettingsScreen = ({
    navigation,
}: StackProps<SettingsStackParamList, SettingsStackRoutes.Settings>) => (
    <Screen>
        <DeviceActionButtons />
        <VStack spacing="xxl">
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
