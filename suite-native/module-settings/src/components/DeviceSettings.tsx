import React from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    SettingsStackRoutes,
    StackNavigationProps,
    SettingsStackParamList,
} from '@suite-native/navigation';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const DeviceSettings = () => {
    const { navigate } =
        useNavigation<StackNavigationProps<SettingsStackParamList, SettingsStackRoutes.Settings>>();

    return (
        <SettingsSection title="Device">
            <SettingsSectionItem
                title="Customization"
                iconName="palette"
                subtitle="Name, Homescreen"
                onPress={() => navigate(SettingsStackRoutes.SettingsCustomization)}
            />
            <SettingsSectionItem
                title="Security"
                iconName="lock"
                subtitle="PIN Active, Passphrase enabled"
                onPress={() => navigate(SettingsStackRoutes.SettingsSecurity)}
            />
            <SettingsSectionItem
                title="Danger Area"
                iconName="lock"
                subtitle="Factory reset, Custom firmware"
                onPress={() => navigate(SettingsStackRoutes.SettingsDangerArea)}
            />
        </SettingsSection>
    );
};
