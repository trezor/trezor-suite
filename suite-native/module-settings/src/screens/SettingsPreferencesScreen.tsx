import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { BitcoinUnitsSelector } from '../components/BitcoinUnitsSelector';
import { ColorSchemePicker } from '../components/ColorSchemePicker';
import { CurrencySelector } from '../components/CurrencySelector';

export const SettingsPreferencesScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader title={<Translation id="moduleSettings.preferences.title" />} />
        }
    >
        <VStack spacing="sp16">
            <CurrencySelector />
            <BitcoinUnitsSelector />
            <ColorSchemePicker />
        </VStack>
    </Screen>
);
