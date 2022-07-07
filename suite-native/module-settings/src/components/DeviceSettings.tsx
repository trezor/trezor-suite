import { useNavigation } from '@react-navigation/native';
import React from 'react';

import { SettingsScreenProp, SettingsStackRoutes } from '../navigation/routes';
import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const DeviceSettings = () => {
    const { navigate } = useNavigation<SettingsScreenProp>();

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
