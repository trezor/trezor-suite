import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useAtomValue } from 'jotai';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { TitledSection } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
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
    const isUsbDeviceConnectFeatureEnabled = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);
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
            {isUsbDeviceConnectFeatureEnabled && (
                <>
                    <AppSettingsCardWithIconLayout
                        icon="bookmarkSimple"
                        title={<Translation id="moduleSettings.items.features.viewOnly.title" />}
                        subtitle={
                            <Translation id="moduleSettings.items.features.viewOnly.subtitle" />
                        }
                        onPress={() => navigateTo(SettingsStackRoutes.SettingsViewOnly)}
                        testID="@settings/view-only"
                    />
                    <AppSettingsCardWithIconLayout
                        icon="coins"
                        title={
                            <Translation id="moduleSettings.items.features.coinEnabling.title" />
                        }
                        subtitle={
                            <Translation id="moduleSettings.items.features.coinEnabling.subtitle" />
                        }
                        onPress={() => navigateTo(SettingsStackRoutes.SettingsCoinEnabling)}
                        isDisabled={hasDiscovery}
                        testID="@settings/coin-enabling"
                    />
                    <AppSettingsCardWithIconLayout
                        icon="shieldWarning"
                        title={<Translation id="moduleSettings.items.features.advanced.title" />}
                        subtitle={
                            <Translation id="moduleSettings.items.features.advanced.subtitle" />
                        }
                        onPress={() => navigateTo(SettingsStackRoutes.SettingsDeviceChecks)}
                    />
                </>
            )}
        </TitledSection>
    );
};
