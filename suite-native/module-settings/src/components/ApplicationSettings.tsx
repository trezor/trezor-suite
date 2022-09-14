import React from 'react';

import { useNavigation } from '@react-navigation/core';

import {
    SettingsStackRoutes,
    SettingsStackParamList,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import { isDevelopOrDebugEnv } from '@suite-native/config';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const ApplicationSettings = () => {
    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                SettingsStackParamList,
                SettingsStackRoutes.Settings,
                RootStackParamList
            >
        >();

    const handleNavigation = (routeName: SettingsStackRoutes | RootStackRoutes): void => {
        navigation.navigate(routeName);
    };

    return (
        <SettingsSection title="Application">
            {isDevelopOrDebugEnv() && (
                <SettingsSectionItem
                    iconName="placeholder"
                    title="DEV utils"
                    subtitle="Only for devs and internal testers."
                    onPress={() => handleNavigation(RootStackRoutes.DevUtilsStack)}
                />
            )}
            <SettingsSectionItem
                iconName="flag"
                title="Localisation"
                subtitle="Language, Currency"
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsLocalisation)}
            />
            <SettingsSectionItem
                iconName="label"
                title="Labeling"
                subtitle="Saved locally"
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsLabeling)}
            />
            <SettingsSectionItem
                iconName="eyeglasses"
                title="Advanced"
                subtitle="Usage data, Logs"
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsAdvanced)}
            />
        </SettingsSection>
    );
};
