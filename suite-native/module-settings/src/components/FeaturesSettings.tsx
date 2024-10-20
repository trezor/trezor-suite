import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useAtomValue } from 'jotai';

import {
    SettingsStackRoutes,
    SettingsStackParamList,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import { selectHasDeviceDiscovery } from '@suite-common/wallet-core';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';
import { isDevButtonVisibleAtom } from './ProductionDebug';

type NavigationProp = StackToStackCompositeNavigationProps<
    SettingsStackParamList,
    SettingsStackRoutes.Settings,
    RootStackParamList
>;

export const FeaturesSettings = () => {
    const isDevButtonVisible = useAtomValue(isDevButtonVisibleAtom);
    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const hasDiscovery = useSelector(selectHasDeviceDiscovery);

    const navigation = useNavigation<NavigationProp>();

    const handleNavigation = (routeName: SettingsStackRoutes): void => {
        navigation.navigate(routeName);
    };

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
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsPrivacyAndSecurity)}
                testID="@settings/privacy-and-security"
            />
            {isUsbDeviceConnectFeatureEnabled && (
                <>
                    <SettingsSectionItem
                        iconName="bookmark"
                        title={<Translation id="moduleSettings.items.features.viewOnly.title" />}
                        subtitle={
                            <Translation id="moduleSettings.items.features.viewOnly.subtitle" />
                        }
                        onPress={() => handleNavigation(SettingsStackRoutes.SettingsViewOnly)}
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
                        onPress={() => handleNavigation(SettingsStackRoutes.SettingsCoinEnabling)}
                        isLoading={hasDiscovery}
                        testID="@settings/coin-enabling"
                    />
                </>
            )}
        </SettingsSection>
    );
};
