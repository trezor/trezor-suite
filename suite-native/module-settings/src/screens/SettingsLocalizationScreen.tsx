import { Card, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { CryptoUnitsSelector } from '../components/CryptoUnitsSelector';
import { CurrencySelector } from '../components/CurrencySelector';

export const SettingsLocalizationScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen header={<ScreenHeader content={translate('moduleSettings.localizations.title')} />}>
            <Card>
                <VStack spacing="sp8">
                    <CurrencySelector />
                    <CryptoUnitsSelector />
                </VStack>
            </Card>
        </Screen>
    );
};
