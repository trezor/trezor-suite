import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useAtomValue } from 'jotai';

import { selectHasDeviceDiscovery } from '@suite-common/wallet-core';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    SettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { isDevButtonVisibleAtom } from './ProductionDebug';
import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';
import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const FeaturesSettings = () => {
    const isDevButtonVisible = useAtomValue(isDevButtonVisibleAtom);
    const isUsbDeviceConnectFeatureEnabled = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const navigateTo = useSettingsNavigateTo();

    const hasDiscovery = useSelector(selectHasDeviceDiscovery);

    return (
        <SettingsSection title={<Translation id="moduleSettings.items.features.title" />}>
            {isDevButtonVisible && (
                <SettingsSectionItem
                    iconName="circleDashed"
                    title={<Translation id="moduleSettings.items.features.devUtils.title" />}
                    subtitle={<Translation id="moduleSettings.items.features.devUtils.subtitle" />}
                    onPress={() => navigation.navigate(RootStackRoutes.DevUtilsStack)}
                    testID="@settings/dev-utils"
                />
            )}
            <SettingsSectionItem
                iconName="eye"
                title={<Translation id="moduleSettings.items.features.privacyAndSecurity.title" />}
                subtitle={
                    <Translation id="moduleSettings.items.features.privacyAndSecurity.subtitle" />
                }
                onPress={() => navigateTo(SettingsStackRoutes.SettingsPrivacyAndSecurity)}
                testID="@settings/privacy-and-security"
            />
            {isUsbDeviceConnectFeatureEnabled && (
                <>
                    <SettingsSectionItem
                        iconName="bookmarkSimple"
                        title={<Translation id="moduleSettings.items.features.viewOnly.title" />}
                        subtitle={
                            <Translation id="moduleSettings.items.features.viewOnly.subtitle" />
                        }
                        onPress={() => navigateTo(SettingsStackRoutes.SettingsViewOnly)}
                        testID="@settings/view-only"
                    />
                    <SettingsSectionItem
                        iconName="coins"
                        title={
                            <Translation id="moduleSettings.items.features.coinEnabling.title" />
                        }
                        subtitle={
                            <Translation id="moduleSettings.items.features.coinEnabling.subtitle" />
                        }
                        onPress={() => navigateTo(SettingsStackRoutes.SettingsCoinEnabling)}
                        isLoading={hasDiscovery}
                        testID="@settings/coin-enabling"
                    />
                    <SettingsSectionItem
                        iconName="shieldWarning"
                        title={<Translation id="moduleSettings.items.features.advanced.title" />}
                        subtitle={
                            <Translation id="moduleSettings.items.features.advanced.subtitle" />
                        }
                        onPress={() => navigateTo(SettingsStackRoutes.SettingsDeviceChecks)}
                    />
                </>
            )}
        </SettingsSection>
    );
};
