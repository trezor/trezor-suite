export enum SettingsStackRoutes {
    Settings = 'Settings',
    SettingsLocalisation = 'SettingsLocalisation',
    SettingsLabeling = 'SettingsLabeling',
    SettingsAdvanced = 'SettingsAdvanced',
}

export type SettingsStackParamList = {
    [SettingsStackRoutes.Settings]: undefined;
    [SettingsStackRoutes.SettingsLocalisation]: undefined;
    [SettingsStackRoutes.SettingsLabeling]: undefined;
    [SettingsStackRoutes.SettingsAdvanced]: undefined;
};
