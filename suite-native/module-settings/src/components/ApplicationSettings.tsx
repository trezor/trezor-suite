import { useNavigation } from '@react-navigation/core';
import { useAtomValue } from 'jotai';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    SettingsStackRoutes,
    SettingsStackParamList,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';
import { isDevButtonVisibleAtom } from './ProductionDebug';

export const ApplicationSettings = () => {
    const isDevButtonVisible = useAtomValue(isDevButtonVisibleAtom);
    const [isViewOnlyFeatureEnabled] = useFeatureFlag(FeatureFlag.IsViewOnlyEnabled);

    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                SettingsStackParamList,
                SettingsStackRoutes.Settings,
                RootStackParamList
            >
        >();

    const handleNavigation = (routeName: SettingsStackRoutes): void => {
        navigation.navigate(routeName);
    };

    return (
        <SettingsSection title="Application">
            {isDevButtonVisible && (
                <SettingsSectionItem
                    iconName="placeholder"
                    title="DEV utils"
                    subtitle="Only for devs and internal testers."
                    onPress={() => navigation.navigate(RootStackRoutes.DevUtilsStack)}
                />
            )}
            <SettingsSectionItem
                iconName="flag"
                title="Localization"
                subtitle="Currency, Bitcoin units"
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsLocalization)}
            />
            <SettingsSectionItem
                title="Customization"
                iconName="palette"
                subtitle="Color scheme"
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsCustomization)}
            />
            <SettingsSectionItem
                title="Privacy & Security"
                iconName="eye"
                subtitle="Analytics, Discreet mode, Biometrics"
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsPrivacyAndSecurity)}
            />
            {isViewOnlyFeatureEnabled && (
                <SettingsSectionItem
                    title="View-only"
                    iconName="bookmark"
                    subtitle="Check balances without your Trezor"
                    onPress={() => handleNavigation(SettingsStackRoutes.SettingsViewOnly)}
                />
            )}
        </SettingsSection>
    );
};
