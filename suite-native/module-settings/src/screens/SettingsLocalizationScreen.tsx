import { DeviceManager } from '@suite-native/device-manager';
import { VStack, Card } from '@suite-native/atoms';
import { Screen, ScreenHeader, ScreenSubHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';

import { CurrencySelector } from '../components/CurrencySelector';
import { CryptoUnitsSelector } from '../components/CryptoUnitsSelector';

export const SettingsLocalizationScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            screenHeader={
                <ScreenHeader>
                    <DeviceManager />
                </ScreenHeader>
            }
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
