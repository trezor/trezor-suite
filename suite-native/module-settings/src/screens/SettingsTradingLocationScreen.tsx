import { useNavigation } from '@react-navigation/native';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { ConfirmLocationButton, TradingLocationSettings } from '@suite-native/trading-residence';

export const SettingsTradingLocationScreen = () => {
    const navigation = useNavigation();

    return (
        <Screen header={<ScreenHeader />}>
            <TradingLocationSettings context="settings">
                <ConfirmLocationButton afterConfirm={navigation.goBack} />
            </TradingLocationSettings>
        </Screen>
    );
};
