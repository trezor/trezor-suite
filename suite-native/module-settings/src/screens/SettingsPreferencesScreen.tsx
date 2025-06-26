import { Card, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { ColorSchemePicker } from '../components/ColorSchemePicker';
import { CryptoUnitsSelector } from '../components/CryptoUnitsSelector';
import { CurrencySelector } from '../components/CurrencySelector';

export const SettingsPreferencesScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen header={<ScreenHeader content={translate('moduleSettings.preferences.title')} />}>
            <VStack spacing="sp16">
                <Card>
                    <CurrencySelector />
                </Card>
                <Card>
                    <CryptoUnitsSelector />
                </Card>
                <Card>
                    <ColorSchemePicker />
                </Card>
            </VStack>
        </Screen>
    );
};
