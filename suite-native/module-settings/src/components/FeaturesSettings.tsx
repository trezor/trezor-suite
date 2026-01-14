import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useAtomValue } from 'jotai';

import { selectIsFeatureSuiteSyncAvailable } from '@suite-common/suite-sync';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { TitledSection } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    SettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { AppSettingsCardWithIconLayout } from './AppSettingsCardWithIconLayout';
import { isDevButtonVisibleAtom } from './ProductionDebug';
import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const FeaturesSettings = () => {
    const isDevButtonVisible = useAtomValue(isDevButtonVisibleAtom);
    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isFeatureSuiteSyncAvailable = useSelector(selectIsFeatureSuiteSyncAvailable);

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
            {isFeatureSuiteSyncAvailable && (
                <AppSettingsCardWithIconLayout
                    icon="arrowsClockwise"
                    title={<Translation id="moduleSettings.items.features.suiteSync.title" />}
                    subtitle={<Translation id="moduleSettings.items.features.suiteSync.subtitle" />}
                    onPress={() => navigateTo(SettingsStackRoutes.SettingsLabeling)}
                    testID="@settings/labeling"
                />
            )}
            <AppSettingsCardWithIconLayout
                icon="shieldWarning"
                title={<Translation id="moduleSettings.items.features.advanced.title" />}
                subtitle={<Translation id="moduleSettings.items.features.advanced.subtitle" />}
                onPress={() => navigateTo(SettingsStackRoutes.SettingsAdvanced)}
            />
        </TitledSection>
    );
};
