import React from 'react';

import { useNavigation } from '@react-navigation/core';

import { SettingsStackRoutes } from '@suite-native/navigation';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const SupportSettings = () => {
    const navigation = useNavigation();
    return (
        <SettingsSection title="Support">
            <SettingsSectionItem
                title="About us"
                iconName="trezorT"
                onPress={() => navigation.navigate(SettingsStackRoutes.SettingsAbout)}
            />
        </SettingsSection>
    );
};
