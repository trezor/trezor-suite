import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { CurrencySelector } from '../components/CurrencySelector';

export const SettingsLocalisationScreen = () => (
    <Screen header={<ScreenHeader title="Localisation" />}>
        <VStack spacing={12}>
            <CurrencySelector />
        </VStack>
    </Screen>
);
