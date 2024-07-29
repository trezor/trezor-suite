import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';
import { DiscoveryCoinsFilter } from '@suite-native/coin-enabling';

export const SettingsCoinEnablingScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    content={translate('moduleSettings.coinEnabling.settings.title')}
                />
            }
        >
            <DiscoveryCoinsFilter />
        </Screen>
    );
};
