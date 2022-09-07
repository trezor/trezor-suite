import React from 'react';

import { useNavigation } from '@react-navigation/core';

import {
    SettingsStackRoutes,
    StackNavigationProps,
    SettingsStackParamList,
} from '@suite-native/navigation';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const ApplicationSettings = () => {
    const navigation =
        useNavigation<StackNavigationProps<SettingsStackParamList, SettingsStackRoutes.Settings>>();

    const handleNavigation = (routeName: SettingsStackRoutes): void => {
        navigation.navigate(routeName);
    };

    return (
        <SettingsSection title="Aplication">
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
