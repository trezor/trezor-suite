import { VStack, Card } from '@suite-native/atoms';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';

import { CurrencySelector } from '../components/CurrencySelector';
import { CryptoUnitsSelector } from '../components/CryptoUnitsSelector';

export const SettingsLocalizationScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            subheader={
                <ScreenSubHeader content={translate('moduleSettings.localizations.title')} />
            }
        >
            <Card>
                <VStack spacing="small">
                    <CurrencySelector />
                    <CryptoUnitsSelector />
                </VStack>
            </Card>
        </Screen>
    );
};
