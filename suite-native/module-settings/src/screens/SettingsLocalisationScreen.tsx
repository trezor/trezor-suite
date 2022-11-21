import React from 'react';

import { VStack, Text } from '@suite-native/atoms';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { CurrencySelector } from '../components/CurrencySelector';

export const SettingsLocalisationScreen = () => (
    <Screen
        header={<ScreenHeader titleComponent={<Text variant="titleSmall">Localisation</Text>} />}
    >
        <VStack spacing={12}>
            <CurrencySelector />
        </VStack>
    </Screen>
);
