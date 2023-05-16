import React from 'react';

import { useNavigation } from '@react-navigation/core';

import {
    RootStackParamList,
    SettingsStackParamList,
    SettingsStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const SupportSettings = () => {
    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                SettingsStackParamList,
                SettingsStackRoutes,
                RootStackParamList
            >
        >();

    return (
        <SettingsSection title="Support">
            <SettingsSectionItem
                title="About Trezor Suite Lite"
                iconName="trezorT"
                onPress={() => navigation.navigate(SettingsStackRoutes.SettingsAbout)}
            />
            <SettingsSectionItem
                iconName="questionLight"
                title="Get help"
                subtitle="FAQ, Customer support"
                onPress={() => navigation.navigate(SettingsStackRoutes.SettingsFAQ)}
            />
        </SettingsSection>
    );
};
