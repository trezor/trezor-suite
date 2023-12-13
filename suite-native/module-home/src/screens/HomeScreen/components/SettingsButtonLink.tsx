import { useNavigation } from '@react-navigation/native';

import { Button } from '@suite-native/atoms';
import {
    AppTabsParamList,
    AppTabsRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    SettingsStackRoutes,
    StackToTabCompositeNavigationProp,
} from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';

type NavigationProp = StackToTabCompositeNavigationProp<
    HomeStackParamList,
    HomeStackRoutes.Home,
    AppTabsParamList
>;

export const SettingsButtonLink = () => {
    const { translate } = useTranslate();

    const navigation = useNavigation<NavigationProp>();

    const handleGoToSettings = () => {
        navigation.navigate(AppTabsRoutes.SettingsStack, {
            screen: SettingsStackRoutes.Settings,
        });
    };

    return (
        <Button onPress={handleGoToSettings} colorScheme="tertiaryElevation0" iconLeft="settings">
            {translate('moduleHome.emptyState.portfolioTracker.secondaryButton')}
        </Button>
    );
};
