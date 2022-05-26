export enum SettingsStackRoutes {
    Settings = 'Settings',
    SettingsDetail = 'SettingsDetail',
}

export type SettingsStackParamList = {
    [SettingsStackRoutes.Settings]: undefined;
    [SettingsStackRoutes.SettingsDetail]: { message: string };
};
