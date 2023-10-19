import { VStack, Card } from '@suite-native/atoms';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { CurrencySelector } from '../components/CurrencySelector';
import { CryptoUnitsSelector } from '../components/CryptoUnitsSelector';

export const SettingsLocalizationScreen = () => (
    <Screen header={<ScreenHeader content="Localization" />}>
        <Card>
            <VStack spacing="small">
                <CurrencySelector />
                <CryptoUnitsSelector />
            </VStack>
        </Card>
    </Screen>
);
