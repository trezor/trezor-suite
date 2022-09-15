import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { DeviceSettings } from '../components/DeviceSettings';
import { CoinsSettings } from '../components/CoinsSettings';
import { DeviceActionButtons } from '../components/DeviceActionButtons';

export const SettingsScreen = () => (
    <Screen>
        <DeviceActionButtons />
        <VStack spacing="xxl">
            <ApplicationSettings />
            <DeviceSettings />
            <CoinsSettings />
        </VStack>
    </Screen>
);
