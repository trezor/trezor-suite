import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useAtomValue } from 'jotai';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { TitledSection } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    SettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';
import { AppSettingsCardWithIconLayout } from './AppSettingsCardWithIconLayout';
import { isDevButtonVisibleAtom } from './ProductionDebug';

export const FeaturesSettings = () => {
    const isDevButtonVisible = useAtomValue(isDevButtonVisibleAtom);
    const hasDiscovery = useSelector(selectHasRunningDiscovery);

    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const navigateTo = useSettingsNavigateTo();

    return (
        <TitledSection title={<Translation id="moduleSettings.items.features.title" />}>
            {isDevButtonVisible && (
                <AppSettingsCardWithIconLayout
                    icon="circleDashed"
                    title={<Translation id="moduleSettings.items.features.devUtils.title" />}
                    subtitle={<Translation id="moduleSettings.items.features.devUtils.subtitle" />}
                    onPress={() => navigation.navigate(RootStackRoutes.DevUtilsStack)}
                    testID="@settings/dev-utils"
                />
            )}
            <AppSettingsCardWithIconLayout
                icon="bookmarkSimple"
                title={<Translation id="moduleSettings.items.features.ejectWallets.title" />}
                subtitle={<Translation id="moduleSettings.items.features.ejectWallets.subtitle" />}
                onPress={() => navigateTo(SettingsStackRoutes.SettingsViewOnly)}
                testID="@settings/eject-wallets"
            />
            <AppSettingsCardWithIconLayout
                icon="coins"
                title={<Translation id="moduleSettings.items.features.coinEnabling.title" />}
                subtitle={<Translation id="moduleSettings.items.features.coinEnabling.subtitle" />}
                onPress={() => navigateTo(SettingsStackRoutes.SettingsCoinEnabling)}
                isDisabled={hasDiscovery}
                testID="@settings/coin-enabling"
            />
            <AppSettingsCardWithIconLayout
                icon="shieldWarning"
                title={<Translation id="moduleSettings.items.features.advanced.title" />}
                subtitle={<Translation id="moduleSettings.items.features.advanced.subtitle" />}
                onPress={() => navigateTo(SettingsStackRoutes.SettingsAdvanced)}
                testID="@settings/advanced"
            />
            <AppSettingsCardWithIconLayout
                icon="atom"
                title={<Translation id="moduleSettings.items.features.experimental.title" />}
                subtitle={<Translation id="moduleSettings.items.features.experimental.subtitle" />}
                onPress={() => navigateTo(SettingsStackRoutes.SettingsExperimental)}
                testID="@settings/experimental"
            />
        </TitledSection>
    );
};
