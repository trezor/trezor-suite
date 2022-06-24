import { StackNavigationProp } from '@react-navigation/stack';

export enum SettingsStackRoutes {
    Settings = 'Settings',
    SettingsLocalisation = 'SettingsLocalisation',
    SettingsLabeling = 'SettingsLabeling',
    SettingsAdvanced = 'SettingsAdvanced',
    SettingsCustomization = 'SettingsCustomization',
    SettingsSecurity = 'SettingsSecurity',
    SettingsDangerArea = 'SettingsDangerArea',
}

export type SettingsStackParamList = {
    [SettingsStackRoutes.Settings]: undefined;
    [SettingsStackRoutes.SettingsLocalisation]: undefined;
    [SettingsStackRoutes.SettingsLabeling]: undefined;
    [SettingsStackRoutes.SettingsAdvanced]: undefined;
    [SettingsStackRoutes.SettingsCustomization]: undefined;
    [SettingsStackRoutes.SettingsSecurity]: undefined;
    [SettingsStackRoutes.SettingsDangerArea]: undefined;
};

export type SettingsScreenProp = StackNavigationProp<
    SettingsStackParamList,
    SettingsStackRoutes.Settings
>;
